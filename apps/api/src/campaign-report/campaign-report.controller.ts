import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common'
import { RealmViewContactRequests, ViewContactRequests } from '@podkrepi-bg/podkrepi-types'
import { Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { CampaignReportService } from './campaign-report.service'
import { CreateCampaignReportDto } from './dto/create-campaign-report.dto'
import { UpdateCampaignReportDto } from './dto/update-campaign-report.dto'

@Controller('campaign-report')
export class CampaignReportController {
  constructor(private readonly campaignReportService: CampaignReportService) {}

  @Post()
  @Public()
  async create(@Body() createCampaignReportDto: CreateCampaignReportDto) {
    return await this.campaignReportService.create(createCampaignReportDto)
  }

  //TODO: define custom admin role for campaign reports

  @Get('list')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async findAll() {
    return await this.campaignReportService.listReports()
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async findOne(@Param('id') id: string) {
    return await this.campaignReportService.getReportById(id)
  }

  @Put(':id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async update(@Param('id') id: string, @Body() updateCampaignReportDto: UpdateCampaignReportDto) {
    return await this.campaignReportService.update(id, updateCampaignReportDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async remove(@Param('id') id: string) {
    return await this.campaignReportService.removeReportById(id)
  }
}
