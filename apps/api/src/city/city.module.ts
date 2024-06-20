import { Module } from '@nestjs/common'

import { CityService } from './city.service'
import { CityController } from './city.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CityController],
  providers: [CityService],
})
export class CityModule {}
