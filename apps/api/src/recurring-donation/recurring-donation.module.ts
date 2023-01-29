import { Module } from '@nestjs/common'
import { RecurringDonationService } from './recurring-donation.service'
import { RecurringDonationController } from './recurring-donation.controller'
import { PrismaService } from '../prisma/prisma.service'
import { HttpModule } from '@nestjs/axios'
import { StripeModule } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { useFactoryService } from '../bank-transactions-file/helpers/use-factory-service'

@Module({
  imports: [
    StripeModule.forRootAsync(StripeModule, {
      inject: [ConfigService],
      useFactory: useFactoryService.useFactory,
    }),
    HttpModule,
  ],

  controllers: [RecurringDonationController],
  providers: [
    PrismaService,
    RecurringDonationService,
  ],
})
export class RecurringDonationModule {}
