import { Module } from '@nestjs/common'
import { PaypalController } from './paypal.controller'
import { PaypalService } from './paypal.service'
import { HttpModule } from '@nestjs/axios'
import { CampaignModule } from '../campaign/campaign.module'
import { ConfigService } from '@nestjs/config'
import { DonationsModule } from '../donations/donations.module'

@Module({
  imports: [HttpModule, CampaignModule, DonationsModule],
  controllers: [PaypalController],
  providers: [PaypalService, ConfigService],
  exports: [PaypalService],
})
export class PaypalModule {}
