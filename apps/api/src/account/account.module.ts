import { Module } from '@nestjs/common'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'
import { AuthModule } from '../auth/auth.module'
import { PersonModule } from '../person/person.module'

@Module({
  imports: [AuthModule, PersonModule],
  controllers: [AccountController],
  providers: [AccountService, PrismaService],
})
export class AccountModule {}
