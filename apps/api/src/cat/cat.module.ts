import { Module } from '@nestjs/common'
import { CatService } from './cat.service'
import { CatController } from './cat.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [CatController],
  providers: [CatService, PrismaService],
})
export class CatModule {}
