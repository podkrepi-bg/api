import 'multer'
import {
  Controller,
  Get,
  Post,
  Response,
  Param,
  Delete,
  Inject,
  forwardRef,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { Roles, RoleMatchingMode, Public } from 'nest-keycloak-connect'

import { PersonService } from '../person/person.service'
import { ReportFileService } from './report-file.service'
import { RealmViewContactRequests, ViewContactRequests } from '@podkrepi-bg/podkrepi-types'
import { CampaignReportService } from '../campaign-report/campaign-report.service'

@Controller('report-file')
export class ReportFileController {
  constructor(
    private readonly reportFileService: ReportFileService,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
    private readonly reportService: CampaignReportService,
  ) {}

  @Post(':report_id')
  @Public()
  @UseInterceptors(FilesInterceptor('file'))
  async create(
    @Param('report_id') campaignReportId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const report = await this.reportService.getReportById(campaignReportId)
    if (!report) {
      throw new NotFoundException('No report found with id: ' + campaignReportId)
    }

    const person = await this.personService.findOne(report.personId)
    if (!person) {
      throw new NotFoundException('No person record with id: ' + report.personId)
    }
    return await Promise.all(
      files.map((file) => {
        return this.reportFileService.create(
          campaignReportId,
          file.mimetype,
          file.originalname,
          person,
          file.buffer,
        )
      }),
    )
  }

  //TODO: define custom admin role for campaign report files

  @Get('list/:report_id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async getFilesByCampaignReportId(@Param('report_id') campaignReportId: string) {
    return await this.reportFileService.findMany(campaignReportId)
  }

  @Get(':id')
  @Public()
  // @Roles({
  //   roles: [RealmViewContactRequests.role, ViewContactRequests.role],
  //   mode: RoleMatchingMode.ANY,
  // })
  async findOne(
    @Param('id') id: string,
    @Response({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    const file = await this.reportFileService.findOne(id)
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': 'attachment; filename="' + file.filename + '"',
    })
    return new StreamableFile(file.stream)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.reportFileService.remove(id)
  }
}
