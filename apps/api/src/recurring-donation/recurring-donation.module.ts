import { Module } from '@nestjs/common'
import { RecurringDonationService } from './recurring-donation.service'
import { RecurringDonationController } from './recurring-donation.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [RecurringDonationController],
  providers: [RecurringDonationService, PrismaService],
})
export class RecurringDonationModule {}
