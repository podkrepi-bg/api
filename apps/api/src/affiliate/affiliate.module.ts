import { Module } from '@nestjs/common'
import { AffiliateController } from './affiliate.controller'
import { AffiliateService } from './affiliate.service'
import { PersonModule } from '../person/person.module'
import { DonationsModule } from '../donations/donations.module'
import { CampaignModule } from '../campaign/campaign.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  controllers: [AffiliateController],
  providers: [AffiliateService],
  imports: [PersonModule, DonationsModule, CampaignModule, PrismaModule],
  exports: [AffiliateService],
})
export class AffiliateModule {}
