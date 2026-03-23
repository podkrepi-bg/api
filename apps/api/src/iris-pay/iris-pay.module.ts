import { Module } from '@nestjs/common'
import { IrisPayService } from './iris-pay.service'
import { IrisPayController } from './iris-pay.controller'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { JwtModule } from '@nestjs/jwt'
import { PrismaModule } from '../prisma/prisma.module'
import { CampaignModule } from '../campaign/campaign.module'
import { DonationsModule } from '../donations/donations.module'
import { PaymentSessionService } from './services/payment-session.service'
import { PaymentSessionGuard } from './guards/payment-session.guard'

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    JwtModule.register({}),
    PrismaModule,
    CampaignModule,
    DonationsModule,
  ],
  controllers: [IrisPayController],
  providers: [IrisPayService, PaymentSessionService, PaymentSessionGuard],
})
export class IrisPayModule {}
