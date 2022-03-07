import {
  Controller,
  Get,
  Post,
  Response,
  Param,
  Delete,
  StreamableFile,
} from '@nestjs/common'
import { CampaignFileService } from './campaign-file.service'
import { Public } from 'nest-keycloak-connect'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Multer } from 'multer'

@Controller('campaign-file')
export class CampaignFileController {
  constructor(private readonly campaignFileService: CampaignFileService) {}

  @Post(':campaign_id')
  @Public()
  @UseInterceptors(FilesInterceptor('file'))
  async create(
    @Param('campaign_id') campaignId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await Promise.all(
      files.map((x) =>
        this.campaignFileService.create(campaignId, x.originalname, x.mimetype, x.buffer),
      ),
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
