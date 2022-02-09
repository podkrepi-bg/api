import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { BeneficiaryController } from './beneficiary.controller'
import { BeneficiaryService } from './beneficiary.service'

@Module({
  controllers: [BeneficiaryController],
  providers: [BeneficiaryService, PrismaService],
})
export class BeneficiaryModule {}
