import { Module } from '@nestjs/common'
import { BenefactorService } from './benefactor.service'
import { BenefactorController } from './benefactor.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [BenefactorController],
  providers: [BenefactorService],
})
export class BenefactorModule {}
