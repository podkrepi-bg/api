import { Module } from '@nestjs/common'
import { StripeModule as StripeClientModule } from '@golevelup/nestjs-stripe'
import { StripeService } from './stripe.service'
import { StripeController } from './stripe.controller'
import { ConfigService } from '@nestjs/config'
import { StripeConfigFactory } from '../donations/helpers/stripe-config-factory'
import { CampaignModule } from '../campaign/campaign.module'
import { PersonModule } from '../person/person.module'

import { DonationsModule } from '../donations/donations.module'
import { RecurringDonationModule } from '../recurring-donation/recurring-donation.module'

@Module({
  imports: [
    StripeClientModule.forRootAsync(StripeClientModule, {
      inject: [ConfigService],
      useFactory: StripeConfigFactory.useFactory,
    }),
    CampaignModule,
    PersonModule,
    DonationsModule,
    RecurringDonationModule,
  ],
  providers: [StripeService],
  controllers: [StripeController],
})
export class StripeModule {}
