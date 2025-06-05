import { forwardRef, Module } from '@nestjs/common'
import { StripeModule as StripeClientModule } from '@golevelup/nestjs-stripe'
import { StripeService } from './stripe.service'
import { StripeController } from './stripe.controller'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { StripeConfigFactory } from '../donations/helpers/stripe-config-factory'
import { CampaignModule } from '../campaign/campaign.module'
import { PersonModule } from '../person/person.module'

import { DonationsModule } from '../donations/donations.module'
import { RecurringDonationModule } from '../recurring-donation/recurring-donation.module'
import { StripePaymentService } from './events/stripe-payment.service'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'

@Module({
  imports: [
    StripeClientModule.forRootAsync(StripeClientModule, {
      inject: [ConfigService],
      useFactory: StripeConfigFactory.useFactory,
    }),
    ConfigModule,
    CampaignModule,
    PersonModule,
    DonationsModule,
    forwardRef(()=>RecurringDonationModule),
  ],
  providers: [StripeService, StripePaymentService, EmailService, TemplateService],
  controllers: [StripeController],
  exports: [StripeService]
})
export class StripeModule {}
