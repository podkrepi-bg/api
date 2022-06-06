import { Module } from '@nestjs/common'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports:[AuthModule],
  controllers: [AccountController],
  providers: [AccountService, PersonService, PrismaService],
})
export class AccountModule {}
