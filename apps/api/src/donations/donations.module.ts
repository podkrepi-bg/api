import { StripeModule } from '@golevelup/nestjs-stripe'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Public } from 'nest-keycloak-connect'
import { CampaignModule } from '../campaign/campaign.module'
import { CampaignService } from '../campaign/campaign.service'
import { PersonModule } from '../person/person.module'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultModule } from '../vault/vault.module'
import { VaultService } from '../vault/vault.service'
import { DonationsController } from './donations.controller'
import { DonationsService } from './donations.service'
import { PaymentCreatedService } from './events/payment-created.service'
import { PaymentSucceededService } from './events/payment-intent-succeeded.service'

@Module({
  imports: [
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
    VaultModule,
    CampaignModule,
    PersonModule
  ],
  controllers: [DonationsController],
  providers: [
    DonationsService,
    PaymentCreatedService,
    PaymentSucceededService,
    CampaignService,
    PrismaService,
    VaultService,
    PersonService
  ],
})
export class DonationsModule {}
