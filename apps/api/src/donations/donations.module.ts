import { Module } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { ConfigService } from '@nestjs/config'
import { StripeModule } from '@golevelup/nestjs-stripe'

import { DonationsService } from './donations.service'
import { DonationsController } from './donations.controller'
import { PaymentSucceededService } from './events/payment-intent-succeeded.service'
import { PaymentCreatedService } from './events/payment-created.service'
import { CampaignService } from '../campaign/campaign.service'
import { CampaignModule } from '../campaign/campaign.module'
import { PrismaService } from '../prisma/prisma.service'
import { AccountService } from '../account/account.service'

@Module({
  imports: [
    CampaignModule,
    StripeModule.forRootAsync(StripeModule, {
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        apiKey: config.get('stripe.secretKey', ''),
        webhookConfig: {
          stripeWebhookSecret: config.get('stripe.webhookSecret', ''),
          requestBodyProperty: 'body',
          decorators: [
            /**
             * Avoid Keycloak @AuthGuard and @RoleGuard on Webhook controller
             **/
            Public(),
          ],
        },
      }),
    }),
  ],
  controllers: [DonationsController],
  providers: [
    DonationsService,
    PaymentCreatedService,
    PaymentSucceededService,
    CampaignService,
    PrismaService,
    AccountService
  ],
})
export class DonationsModule {}
