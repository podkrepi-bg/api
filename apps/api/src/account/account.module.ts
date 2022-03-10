import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'

@Module({
  controllers: [AccountController],
  providers: [AccountService, PrismaService],
})
export class AccountModule {}
