import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { TerminusModule } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service'
import { PrismaHealthIndicator } from '../prisma/prisma.health';

@Module({
  controllers: [HealthController],
  providers: [PrismaService, PrismaHealthIndicator],
  imports: [TerminusModule],
})
export class HealthModule {}
