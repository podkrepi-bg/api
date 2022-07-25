import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { DonationWishService } from './donation-wish.service'
import { CreateDonationWishDto } from './dto/create-donation-wish.dto'

@Controller('donation-wish')
export class DonationWishController {
  constructor(private readonly donationWishService: DonationWishService) {}

  @Post()
  @Public()
  create(@Body() createDonationWishDto: CreateDonationWishDto) {
    console.log(createDonationWishDto)
    return this.donationWishService.create(createDonationWishDto)
  }

  @Get('list/:campaignId')
  @Public()
  findList(@Param('campaignId') campaignId: string) {
    console.log(campaignId)
    return this.donationWishService.findWishesByCampaignId(campaignId)
  }
}
