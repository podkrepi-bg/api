import { Module } from '@nestjs/common'
import { StripeModule } from '@golevelup/nestjs-stripe'

import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'

@Module({
  imports: [
    StripeModule.forRoot(StripeModule, {
      apiKey: `${process.env.STRIPE_APIKEY}`,
      webhookConfig: {
        stripeWebhookSecret: `${process.env.STRIPE_WEBHOOK_SECRET}`,
      },
    }),
    // Switch to factory version once this issue is closed
    // https://github.com/golevelup/nestjs/issues/327
    // StripeModule.forRootAsync(StripeModule, {
    //   imports: [StripeModule],
    //   inject: [ConfigService],
    //   useFactory: async (config: ConfigService) => ({
    //     apiKey: config.get('stripe.apikey', ''),
    //     webhookConfig: {
    //       stripeWebhookSecret: config.get('stripe.webhookSecret', ''),
    //     },
    //   }),
    // }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
