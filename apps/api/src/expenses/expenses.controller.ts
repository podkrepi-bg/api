import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Response,
  StreamableFile,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { isAdmin, KeycloakTokenParsed } from '../auth/keycloak'
import { ExpensesService } from './expenses.service'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'
import { ApiTags } from '@nestjs/swagger'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { validateFileType } from '../common/files'

@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('list')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async findAll() {
    return await this.expensesService.listExpenses()
  }

  @Post('create-expense')
  async create(
    @AuthenticatedUser() user: KeycloakTokenParsed,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    await this.verifyCampaignOwnership(user, createExpenseDto.vaultId)
    return this.expensesService.createExpense(createExpenseDto)
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id)
  }

  @Patch(':id')
  async update(
    @AuthenticatedUser() user: KeycloakTokenParsed,
    @Param('id') id: string,
    @Body() data: UpdateExpenseDto,
  ) {
    await this.verifyCampaignOwnership(user, data.vaultId || '0')

    return this.expensesService.update(id, data)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id)
  }

  @Post(':expenseId/files')
  @UseInterceptors(
    FilesInterceptor('file', 5, {
      limits: { fileSize: 1024 * 1024 * 10 }, //limit uploaded files to 5 at once and 10MB each
      fileFilter: (_req: Request, file, cb) => {
        validateFileType(file, cb)
      },
    }),
  )
  async uploadFiles(
    @Param('expenseId') expenseId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const uploaderId = await this.expensesService.findUploaderId(user.sub)

    return this.expensesService.uploadFiles(expenseId, files, uploaderId)
  }

  @Get(':id/files')
  @Public()
  getUploadedFiles(@Param('id') id: string) {
    return this.expensesService.listUploadedFiles(id)
  }

  @Get('download-file/:fileId')
  @Public()
  async downloadFile(
    @Param('fileId') fileId: string,
    @Response({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    const file = await this.expensesService.downloadFile(fileId)
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': 'inline; filename="' + file.filename + '"',
    })
    return new StreamableFile(file.stream)
  }

  @Delete('file/:fileId')
  removeFile(@Param('fileId') fileId: string) {
    return this.expensesService.removeFile(fileId)
  }

  private async verifyCampaignOwnership(user: KeycloakTokenParsed, vaultId: string) {
    if (!user || !user.sub) {
      throw new NotFoundException('User not found')
    }

    if (isAdmin(user)) {
      return
    }

    const isOwner = await this.expensesService.checkCampaignOwner(user.sub, vaultId)
    if (!isOwner) {
      throw new UnauthorizedException()
    }
  }
}
