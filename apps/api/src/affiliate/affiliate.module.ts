import { Module } from '@nestjs/common'
import { AffiliateController } from './affiliate.controller'
import { AffiliateService } from './affiliate.service'
import { PersonModule } from '../person/person.module'
import { PrismaService } from '../prisma/prisma.service'
import { DonationsModule } from '../donations/donations.module'
import { CampaignModule } from '../campaign/campaign.module'

@Module({
  controllers: [AffiliateController],
  providers: [AffiliateService, PrismaService],
  imports: [PersonModule, DonationsModule, CampaignModule],
  exports: [AffiliateService],
})
export class AffiliateModule {}
