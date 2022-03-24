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
} from '@nestjs/common'
import { CampaignFileService } from './campaign-file.service'
import { Public, AuthenticatedUser } from 'nest-keycloak-connect'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { PersonService } from '../person/person.service'

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
    @Body() body: { filesRole: string },
    @UploadedFiles() files: Express.Multer.File[],
    @AuthenticatedUser() user,
  ) {
    const filesRole = JSON.parse(body.filesRole)
    const person = await this.personService.findOneByKeycloakId(user.sub)
    if (!person) {
      Logger.warn('No person record with keycloak ID: ' + user.sub)
      throw new NotFoundException('No person record with keycloak ID: ' + user.sub)
    }
    return await Promise.all(
      files.map((file) => {
        return this.campaignFileService.create(
          filesRole.find((f) => f.file === file.originalname).role,
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
      'Content-Type': '' + file.file.mimetype + '',
      'Content-Disposition': 'attachment; filename="' + file.file.filename + '"',
    })

    return new StreamableFile(file.stream)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.campaignFileService.remove(id)
  }
}
