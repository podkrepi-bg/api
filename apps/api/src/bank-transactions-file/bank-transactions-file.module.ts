import { forwardRef, Module } from '@nestjs/common'
import { BankTransactionsFileService } from './bank-transactions-file.service'
import { BankTransactionsFileController } from './bank-transactions-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { DonationsService } from '../donations/donations.service'
import { VaultService } from '../vault/vault.service'
import { CampaignService } from '../campaign/campaign.service'
import { VaultModule } from '../vault/vault.module'
import { DonationsModule } from '../donations/donations.module'
import { CampaignModule } from '../campaign/campaign.module'
import { ConfigService } from '@nestjs/config'
import { StripeModule } from '@golevelup/nestjs-stripe'
import { Public } from 'nest-keycloak-connect'

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
  ],
  controllers: [BankTransactionsFileController],
  providers: [
    BankTransactionsFileService,
    PrismaService,
    S3Service,
    PersonService,
    VaultService,
    CampaignService,
    DonationsService,
  ],
})
export class BankTransactionsFileModule {}
