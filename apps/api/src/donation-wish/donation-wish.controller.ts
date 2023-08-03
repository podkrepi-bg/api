import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { DonationWishService } from './donation-wish.service'
import { CreateDonationWishDto } from './dto/create-donation-wish.dto'
import { ApiTags } from '@nestjs/swagger'
import { DonationQueryDto } from '../common/dto/donation-query-dto'
import { DonationWishQueryDecorator } from './dto/filter-donation-wish.dto'

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
  @DonationWishQueryDecorator()
  findList(@Query() query?: DonationQueryDto) {
    return this.donationWishService.findWishesByCampaignId(
      query?.campaignId,
      query?.minAmount,
      query?.maxAmount,
      query?.from,
      query?.to,
      query?.search,
      query?.sortBy,
      query?.sortOrder,
      query?.pageindex,
      query?.pagesize,
    )
  }
}
