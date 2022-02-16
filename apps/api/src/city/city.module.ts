import { Module } from '@nestjs/common'

import { CityService } from './city.service'
import { CityController } from './city.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [CityController],
  providers: [CityService, PrismaService],
})
export class CityModule {}
