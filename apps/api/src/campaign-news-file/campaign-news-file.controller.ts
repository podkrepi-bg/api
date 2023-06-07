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
  Inject,
  forwardRef,
  ForbiddenException,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { Public, AuthenticatedUser } from 'nest-keycloak-connect'
import { PersonService } from '../person/person.service'
import { FilesRoleDto } from './dto/files-role.dto'
import { CampaignNewsFileService } from './campaign-news-file.service'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('campaign-news-file')
@Controller('campaign-news-file')
export class CampaignNewsFileController {
  constructor(
    private readonly campaignFileService: CampaignNewsFileService,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
  ) {}

  @Post(':article_id')
  @UseInterceptors(FilesInterceptor('file', 10, { limits: { fileSize: 20485760 } })) //limit uploaded files to 5 at once and 10MB each
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

    if (!isAdmin(user)) {
      throw new ForbiddenException('User has no access to this operation.')
    }

    const filesRole = body.roles
    return await Promise.all(
      files.map((file, key) => {
        return this.campaignFileService.create(
          Array.isArray(filesRole) ? filesRole[key] : filesRole,
          articleId,
          file.mimetype,
          file.originalname,
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
    const file = await this.campaignFileService.findOne(id)
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': 'inline; filename="' + file.filename + '"',
    })

    return new StreamableFile(file.stream)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    console.log(` called`)
    return this.campaignFileService.remove(id)
  }
}
