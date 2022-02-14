import { Module } from '@nestjs/common';
import { BenefactorService } from './benefactor.service';
import { BenefactorController } from './benefactor.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BenefactorController],
  providers: [BenefactorService, PrismaService]
})
export class BenefactorModule {}
