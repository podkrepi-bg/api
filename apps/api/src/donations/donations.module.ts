import { Module } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { StripeModule } from '@golevelup/nestjs-stripe'

import { DonationsService } from './donations.service'
import { DonationsController } from './donations.controller'
import { PaymentSucceededService } from './events/payment-intent-succeeded.service'
import { PaymentCreatedService } from './events/payment-created.service'

@Module({
  imports: [
    StripeModule.forRoot(StripeModule, {
      apiKey: `${process.env.STRIPE_SECRET_KEY}`,
      webhookConfig: {
        requestBodyProperty: 'body',
        stripeWebhookSecret: `${process.env.STRIPE_WEBHOOK_SECRET}`,
        decorators: [
          Public(), // TODO: Verify that this is secure enough
        ],
      },
    }),
    // Switch to factory version once this issue is closed
    // https://github.com/golevelup/nestjs/issues/327
    // StripeModule.forRootAsync(StripeModule, {
    //   imports: [StripeModule],
    //   inject: [ConfigService],
    //   useFactory: async (config: ConfigService) => ({
    //     apiKey: config.get('stripe.secretKey', ''),
    //     webhookConfig: {
    //       stripeWebhookSecret: config.get('stripe.webhookSecret', ''),
    //     },
    //   }),
    // }),
  ],
  controllers: [DonationsController],
  providers: [DonationsService, PaymentCreatedService, PaymentSucceededService],
})
export class DonationsModule {}
