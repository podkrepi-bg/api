import { Public } from 'nest-keycloak-connect'
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common'
import { CacheInterceptor } from '@nestjs/cache-manager'

import { StatisticsService } from './statistics.service'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { GroupBy } from './dto/group-by.dto'

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('donations/:campaignId')
  @UseInterceptors(CacheInterceptor)
  @Public()
  @ApiQuery({ name: 'groupBy', required: false, enum: GroupBy })
  async findGroupedDonations(
    @Param('campaignId') campaignId: string,
    @Query('groupBy') groupBy?: GroupBy,
  ) {
    return await this.statisticsService.listGroupedDonations(campaignId, groupBy)
  }

  @Get('unique-donations/:campaignId')
  @UseInterceptors(CacheInterceptor)
  @Public()
  async findUniqueDonations(@Param('campaignId') campaignId: string) {
    return await this.statisticsService.listUniqueDonations(campaignId)
  }

  @Get('hourly-donations/:campaignId')
  @UseInterceptors(CacheInterceptor)
  @Public()
  async findHourlyDonations(@Param('campaignId') campaignId: string) {
    return await this.statisticsService.listHourlyDonations(campaignId)
  }
}
