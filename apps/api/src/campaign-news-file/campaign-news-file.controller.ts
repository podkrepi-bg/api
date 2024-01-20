import 'multer'
import {
  Controller,
  Get,
  Post,
  Response,
  Param,
  Delete,
  StreamableFile,
  NotFoundException,
  Logger,
  Body,
  ForbiddenException,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { Public, AuthenticatedUser } from 'nest-keycloak-connect'
import { PersonService } from '../person/person.service'
import { FilesRoleDto } from './dto/files-role.dto'
import { CampaignNewsFileService } from './campaign-news-file.service'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { ApiTags } from '@nestjs/swagger'
import { validateFileType } from '../common/files'
import { CampaignNewsService } from '../campaign-news/campaign-news.service'

@ApiTags('campaign-news-file')
@Controller('campaign-news-file')
export class CampaignNewsFileController {
  constructor(
    private readonly campaignNewsFileService: CampaignNewsFileService,
    private readonly personService: PersonService,
    private readonly campaignNewsService: CampaignNewsService,
  ) {}

  @Post(':article_id')
  @UseInterceptors(
    FilesInterceptor('file', 10, {
      limits: { fileSize: 1024 * 1024 * 10 }, //limit uploaded files to 10 at once and 10MB each
      fileFilter: (_req: Request, file, cb) => {
        validateFileType(file, cb)
      },
    }),
  )
  async create(
    @Param('article_id') articleId: string,
    @Body() body: FilesRoleDto,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const keycloakId = user.sub
    const person = await this.personService.findOneByKeycloakId(keycloakId)

    if (!person) {
      Logger.warn('No person record with keycloak ID: ' + keycloakId)
      throw new NotFoundException('No person record with keycloak ID: ' + keycloakId)
    }

    const canEditArticle = await this.campaignNewsService.canEditArticle(articleId, user)

    if (!canEditArticle) {
      throw new ForbiddenException('User has no access to this operation.')
    }

    const filesRole = body.roles
    return await Promise.all(
      files.map((file, key) => {
        return this.campaignNewsFileService.create(
          Array.isArray(filesRole) ? filesRole[key] : filesRole,
          articleId,
          file.mimetype,
          Buffer.from(file.originalname, 'latin1').toString('utf-8'),
          person,
          file.buffer,
        )
      }),
    )
  }

  @Get(':id')
  @Public()
  async findOne(
    @Param('id') id: string,
    @Response({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    const file = await this.campaignNewsFileService.findOne(id)
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': 'inline; filename="' + file.filename + '"',
    })

    return new StreamableFile(file.stream)
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @AuthenticatedUser() user: KeycloakTokenParsed) {
    const canDelete = await this.campaignNewsFileService.canDeleteNewsFile(id, user)
    if (!canDelete) throw new ForbiddenException('User has no access for this operation')
    return this.campaignNewsFileService.remove(id)
  }
}
