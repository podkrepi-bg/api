import { Module } from '@nestjs/common'
import { BankTransactionsFileService } from './bank-transactions-file.service'
import { BankTransactionsFileController } from './bank-transactions-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { DonationsService } from '../donations/donations.service'
import { VaultService } from '../vault/vault.service'
import { CampaignService } from '../campaign/campaign.service'
import { ConfigService } from '@nestjs/config'
import { StripeModule } from '@golevelup/nestjs-stripe'
import { useFactoryService } from './helpers/use-factory-service'
import { ExportService } from '../export/export.service'
import { WebSocketModule } from '../sockets/socket.module'

@Module({
  imports: [
    StripeModule.forRootAsync(StripeModule, {
      inject: [ConfigService],
      useFactory: useFactoryService.useFactory,
    }),
    WebSocketModule,
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
    ExportService,
  ],
})
export class BankTransactionsFileModule {}
