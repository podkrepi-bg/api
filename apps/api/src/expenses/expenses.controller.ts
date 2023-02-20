import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common'
import { Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

import { ExpensesService } from './expenses.service'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'
import { ApiTags } from '@nestjs/swagger'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'

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
  @UseInterceptors(FilesInterceptor('file', 5, { limits: { fileSize: 10485760 } })) //limit uploaded files to 5 at once and 10MB each
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @UploadedFiles() files: Express.Multer.File[]) {
    return this.expensesService.createExpense(createExpenseDto, files)
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() data: UpdateExpenseDto) {
    return this.expensesService.update(id, data)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id)
  }

  @Get('campaign/:slug')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async listCampaignExpenses(@Param('slug') slug: string) {
    return this.expensesService.listCampaignExpenses(slug)
  }

  @Post('upload-files/:id')
  @UseInterceptors(FilesInterceptor('file', 5, { limits: { fileSize: 10485760 } })) //limit uploaded files to 5 at once and 10MB each
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  uploadFiles(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[]) {
    return this.expensesService.uploadFiles(id, files)
  }


  @Get('files/:id')
  getUploadedFiles(@Param('id') id: string) {
    return this.expensesService.listUploadedFiles(id)
  }
}
