import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
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
    return this.campaignReportService.getReport(campaignId, reportId)
  }

  @Get(':campaignId/reports/:reportId/files/:fileId')
  @Public()
  async getFile(
    @Param('campaignId') campaignId: string,
    @Param('reportId') reportId: string,
    @Param('fileId') fileId: string,
    @Response({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    const file = await this.campaignReportService.getReportFile(campaignId, reportId, fileId)
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

    await this.campaignReportService.updateReport(
      campaignId,
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

    await this.campaignReportService.softDeleteReport(campaignId, reportId)
  }

  private async userCanPerformReportAction(
    campaignId: string,
    user: KeycloakTokenParsed,
  ): Promise<Person | null> {
    const userCanPerformProtectedCampaignAction =
      await this.campaignService.userCanPerformProtectedCampaignAction(campaignId, user.sub)

    const person = await this.personService.findOneByKeycloakId(user.sub)
    if (!person) {
      Logger.warn('No person record with keycloak ID: ' + user.sub)
    }

    return userCanPerformProtectedCampaignAction && person !== null ? person : null
  }
}
