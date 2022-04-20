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
  forwardRef
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { Public, AuthenticatedUser } from 'nest-keycloak-connect'
import { PersonService } from '../person/person.service'
import { FilesRoleDto } from './dto/files-role.dto'
import { CampaignFileService } from './campaign-file.service'
import { CampaignService } from '../campaign/campaign.service'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'

@Controller('campaign-file')
export class CampaignFileController {
  constructor(
    private readonly campaignFileService: CampaignFileService,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
    private readonly campaignService: CampaignService,
  ) {}

  @Post(':campaign_id')
  @UseInterceptors(FilesInterceptor('file'))
  async create(
    @Param('campaign_id') campaignId: string,
    @Body() body: FilesRoleDto,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const keycloakId = user.sub as string
    const person = await this.personService.findOneByKeycloakId(keycloakId)
    if (!person) {
      Logger.warn('No person record with keycloak ID: ' + keycloakId)
      throw new NotFoundException('No person record with keycloak ID: ' + keycloakId)
    }

    if (!isAdmin(user)) {
      const campaign = await this.campaignService.getCampaignByIdAndPersonId(campaignId, person.id)
      if (!campaign) {
        throw new NotFoundException('No campaign found for logged user')
      }
    }

    const filesRole = body.roles
    return await Promise.all(
      files.map((file, key) => {
        return this.campaignFileService.create(
          Array.isArray(filesRole) ? filesRole[key] : filesRole,
          campaignId,
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
      'Content-Disposition': 'attachment; filename="' + file.filename + '"',
    })

    return new StreamableFile(file.stream)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.campaignFileService.remove(id)
  }
}
