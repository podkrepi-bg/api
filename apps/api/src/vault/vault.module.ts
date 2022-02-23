import { Module } from '@nestjs/common'
import { VaultService } from './vault.service'
import { VaultController } from './vault.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [VaultController],
  providers: [VaultService, PrismaService],
})
export class VaultModule {}
