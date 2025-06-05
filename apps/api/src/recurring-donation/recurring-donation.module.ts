import { forwardRef, Module } from '@nestjs/common'
import { RecurringDonationService } from './recurring-donation.service'
import { RecurringDonationController } from './recurring-donation.controller'
import { HttpModule } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'
import { StripeModule } from '../stripe/stripe.module'

@Module({
  imports: [
    forwardRef(() => StripeModule),
    HttpModule,
    PrismaModule,
  ],

  controllers: [RecurringDonationController],
  providers: [RecurringDonationService],
  exports: [RecurringDonationService],
})
export class RecurringDonationModule {}
