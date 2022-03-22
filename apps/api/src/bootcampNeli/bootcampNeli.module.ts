import { Module } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { BootcampNeliService } from './bootcampNeli.service'

import { BootcampNeliController } from './bootcampNeli.controller'

@Module({
  controllers: [BootcampNeliController],
  providers: [BootcampNeliService, PrismaService],
})
export class BootcampNeliModule {}