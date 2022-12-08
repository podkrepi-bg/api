import { Module } from '@nestjs/common'
import { ExportService } from './export.service'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  providers: [ExportService, PrismaService],
  exports: [ExportService],
})
export class ExportModule {}
