import { Module } from '@nestjs/common'
import { DonationWishService } from './donation-wish.service'
import { DonationWishController } from './donation-wish.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [DonationWishController],
  providers: [DonationWishService, PrismaService],
})
export class DonationWishModule {}
