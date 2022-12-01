import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { plainToInstance } from 'class-transformer'
import { AuthenticatedUser, Public } from 'nest-keycloak-connect'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { CampaignReportService } from './campaign-report.service'
import { CreateReportDto } from './dto/create-report.dto'

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
  async getReports(@Param('campaignId') campaignId: number): Promise<string> {
    return Promise.resolve(`Hi from campaignId ${campaignId}`)
  }

  @Get(':campaignId/reports/:reportId')
  async getReport(
    @Param('campaignId') campaignId: number,
    @Param('reportId') reportId: number,
  ): Promise<void> {}

  @Post(':campaignId/reports')
  @Public()
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
  async addReport(
    @Param('campaignId') campaignId: string,
    @UploadedFiles() files: { photos?: Express.Multer.File[]; documents?: Express.Multer.File[] },
    @Body() report: CreateReportDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
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

    if (campaign === null || !userCanUploadReport || !person) {
      throw new ForbiddenException('The user cannot modify the requested campaign')
    }

    const createReportDto: CreateReportDto = plainToInstance(CreateReportDto, { ...report })
    const createdReportId = await this.campaignReportService.createReport(
      createReportDto,
      campaignId,
      person.id,
      files.photos ?? [],
      files.documents ?? [],
    )
    return createdReportId
  }

  @Put(':/campaignId/reports/:reportId')
  async updateReport(
    @Param('campaignId') campaignId: number,
    @Param('reportId') reportId: number,
    @Body() updatedReport: any,
  ) {}

  @Delete(':campaignId/reports/:reportId')
  async deleteReport(
    @Param('campaignId') campaignId: number,
    @Param('reportId') reportId: number,
  ) {}
}
