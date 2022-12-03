import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  StreamableFile,
  Response,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { Person } from '@prisma/client'
import { plainToInstance } from 'class-transformer'
import { AuthenticatedUser, Public } from 'nest-keycloak-connect'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { CampaignReportService } from './campaign-report.service'
import { CreateReportDto } from './dto/create-report.dto'
import { GetReportDto } from './dto/get-report.dto'
import { ListReportsDto } from './dto/list-reports.dto'
import { UpdateReportDto } from './dto/update-report.dto'

@ApiTags('campaign-report')
@Controller('campaign')
export class CampaignReportController {
  constructor(
    private campaignReportService: CampaignReportService,
    private campaignService: CampaignService,
    private personService: PersonService,
  ) {}

  @Get(':campaignId/reports')
  @Public()
  async getAllReports(@Param('campaignId') campaignId: string): Promise<ListReportsDto[]> {
    return this.campaignReportService.getReports(campaignId)
  }

  @Get(':campaignId/reports/:reportId')
  @Public()
  async getReport(
    @Param('campaignId') campaignId: string,
    @Param('reportId') reportId: string,
  ): Promise<GetReportDto> {
    const campaignReports = await this.campaignReportService.getReports(campaignId)

    if (!campaignReports.map((report) => report.id).includes(reportId)) {
      throw new NotFoundException('The given report is not part of the selected campaign')
    }

    const report = await this.campaignReportService.getReport(reportId)

    if (report === null) {
      throw new NotFoundException(`Report with id ${reportId} does not exist`)
    }

    return report
  }

  @Get(':campaignId/reports/:reportId/files/:fileId')
  @Public()
  async getFile(
    @Param('campaignId') campaignId: string,
    @Param('reportId') reportId: string,
    @Param('fileId') fileId: string,
    @Response({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    const campaignReports = await this.campaignReportService.getReports(campaignId)
    const report = await this.campaignReportService.getReport(reportId)

    if (!campaignReports.map((report) => report.id).includes(reportId)) {
      throw new NotFoundException('The given report is not part of the selected campaign')
    }

    const fileIsInReport = [
      ...(report?.photos ?? []).map(photo => photo.id),
      ...(report?.documents ?? []).map(document => document.id)]
      .includes(fileId)

    if (!fileIsInReport) {
      throw new NotFoundException('The given file is not part of the report')
    }

    const file = await this.campaignReportService.getReportFile(fileId)
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': 'attachment; filename="' + file.filename + '"',
    })

    return new StreamableFile(file.stream)
  }

  @Post(':campaignId/reports')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'photos', maxCount: 5 },
        { name: 'documents', maxCount: 5 },
      ],
      {
        limits: { fileSize: 1024 * 1024 * 10 },
      },
    ),
  )
  async create(
    @Param('campaignId') campaignId: string,
    @UploadedFiles() files: { photos?: Express.Multer.File[]; documents?: Express.Multer.File[] },
    @Body() report: CreateReportDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const authorizedPerson = await this.userCanPerformReportAction(campaignId, user)
    if (!authorizedPerson) {
      throw new ForbiddenException('The user cannot modify the requested campaign')
    }

    const createReportDto: CreateReportDto = plainToInstance(CreateReportDto, { ...report })
    const createdReportId = await this.campaignReportService.createReport(
      createReportDto,
      campaignId,
      authorizedPerson.id,
      files.photos ?? [],
      files.documents ?? [],
    )
    return createdReportId
  }

  @Patch(':campaignId/reports/:reportId')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'photos', maxCount: 5 },
        { name: 'documents', maxCount: 5 },
      ],
      {
        limits: { fileSize: 1024 * 1024 * 10 },
      },
    ),
  )
  async update(
    @Param('campaignId') campaignId: string,
    @Param('reportId') reportId: string,
    @UploadedFiles() files: { photos?: Express.Multer.File[]; documents?: Express.Multer.File[] },
    @Body() updatedReport: UpdateReportDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const authorizedPerson = await this.userCanPerformReportAction(campaignId, user)
    if (!authorizedPerson) {
      throw new ForbiddenException('The user cannot modify the requested campaign')
    }

    const campaignReports = await this.campaignReportService.getReports(campaignId)

    if (!campaignReports.map((report) => report.id).includes(reportId)) {
      throw new NotFoundException('The given report is not part of the selected campaign')
    }

    await this.campaignReportService.updateReport(
      reportId,
      authorizedPerson.id,
      updatedReport,
      files.photos ?? [],
      files.documents ?? [],
    )
  }

  @Delete(':campaignId/reports/:reportId')
  async delete(
    @Param('campaignId') campaignId: string,
    @Param('reportId') reportId: string,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const authorizedPerson = await this.userCanPerformReportAction(campaignId, user)
    if (!authorizedPerson) {
      throw new ForbiddenException('The user cannot modify the requested campaign')
    }

    const campaignReports = await this.campaignReportService.getReports(campaignId)

    if (!campaignReports.map((report) => report.id).includes(reportId)) {
      throw new NotFoundException('The given report is not part of the selected campaign')
    }

    await this.campaignReportService.softDeleteReport(reportId)
  }

  private async userCanPerformReportAction(
    campaignId: string,
    user: KeycloakTokenParsed,
  ): Promise<Person | null> {
    const campaign = await this.campaignService.getCampaignByIdWithPersonIds(campaignId)
    const userCanUploadReport = [
      campaign?.beneficiary.person?.keycloakId,
      campaign?.organizer?.person.keycloakId,
      campaign?.coordinator.person.keycloakId,
    ].includes(user.sub)

    const person = await this.personService.findOneByKeycloakId(user.sub)
    if (!person) {
      Logger.warn('No person record with keycloak ID: ' + user.sub)
    }

    return campaign !== null && person !== null && userCanUploadReport ? person : null
  }
}
