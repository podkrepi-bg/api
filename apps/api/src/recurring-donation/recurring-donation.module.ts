import { Module } from '@nestjs/common'
import { RecurringDonationService } from './recurring-donation.service'
import { RecurringDonationController } from './recurring-donation.controller'
import { HttpModule } from '@nestjs/axios'
import { StripeModule } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { StripeConfigFactory } from '../donations/helpers/stripe-config-factory'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [
    StripeModule.forRootAsync(StripeModule, {
      inject: [ConfigService],
      useFactory: StripeConfigFactory.useFactory,
    }),
    HttpModule,
    PrismaModule,
  ],

  controllers: [RecurringDonationController],
  providers: [RecurringDonationService],
  exports: [RecurringDonationService],
})
export class RecurringDonationModule {}
