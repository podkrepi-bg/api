import { Module } from '@nestjs/common'
import { PersonService } from './person.service'
import { PersonController } from './person.controller'
import { PrismaService } from '../prisma/prisma.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule],
  controllers: [PersonController],
  providers: [PersonService, PrismaService],
  exports: [PersonService],
})
export class PersonModule {}
