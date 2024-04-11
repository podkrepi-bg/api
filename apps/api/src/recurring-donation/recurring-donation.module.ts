import { Module } from '@nestjs/common'
import { RecurringDonationService } from './recurring-donation.service'
import { RecurringDonationController } from './recurring-donation.controller'
import { PrismaService } from '../prisma/prisma.service'
import { HttpModule } from '@nestjs/axios'
import { StripeModule } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { StripeConfigFactory } from '../donations/helpers/stripe-config-factory'

@Module({
  imports: [
    StripeModule.forRootAsync(StripeModule, {
      inject: [ConfigService],
      useFactory: StripeConfigFactory.useFactory,
    }),
    HttpModule,
  ],

  controllers: [RecurringDonationController],
  providers: [PrismaService, RecurringDonationService],
  exports: [RecurringDonationService],
})
export class RecurringDonationModule {}
