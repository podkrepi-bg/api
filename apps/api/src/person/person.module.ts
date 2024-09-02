import { Module } from '@nestjs/common'
import { PersonService } from './person.service'
import { PersonController } from './person.controller'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PersonController],
  providers: [PersonService],
  exports: [PersonService],
})
export class PersonModule {}
