import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { DonationWishService } from './donation-wish.service'
import { CreateDonationWishDto } from './dto/create-donation-wish.dto'
import { ApiTags, ApiQuery } from '@nestjs/swagger'
import { DonationQueryDto } from '../common/dto/donation-query-dto'

@ApiTags('donation-wish')
@Controller('donation-wish')
export class DonationWishController {
  constructor(private readonly donationWishService: DonationWishService) {}

  @Post()
  @Public()
  create(@Body() createDonationWishDto: CreateDonationWishDto) {
    return this.donationWishService.create(createDonationWishDto)
  }

  @Get('list/:campaignId')
  @Public()
  @ApiQuery({ name: 'pageindex', required: false, type: Number })
  @ApiQuery({ name: 'pagesize', required: false, type: Number })
  findList(@Param('campaignId') campaignId: string, @Query() query?: DonationQueryDto) {
    return this.donationWishService.findWishesByCampaignId(
      campaignId,
      query?.pageindex,
      query?.pagesize,
    )
  }
}
