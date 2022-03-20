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
} from '@nestjs/common'
import { CampaignFileService } from './campaign-file.service'
import { Public, AuthenticatedUser } from 'nest-keycloak-connect'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Multer } from 'multer'
import mimeDb from 'mime-types'
import { PersonService } from '../person/person.service'
import { CampaignFileRole } from '@prisma/client'

@Controller('campaign-file')
export class CampaignFileController {
  constructor(
    private readonly campaignFileService: CampaignFileService,
    private readonly personService: PersonService,
  ) {}

  @Post(':campaign_id')
  @UseInterceptors(FilesInterceptor('file'))
  async create(
    @Param('campaign_id') campaignId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthenticatedUser() user,
  ) {
    const person = await this.personService.findOneByKeycloakId(user.sub)
    if (!person) {
      Logger.warn('No person record with keycloak ID: ' + user.sub)
      throw new NotFoundException('No person record with keycloak ID: ' + user.sub)
    }
    return await Promise.all(
      files.map((file) => {
        return this.campaignFileService.create(
          CampaignFileRole.background,
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
      'Content-Type': 'application/json',
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
