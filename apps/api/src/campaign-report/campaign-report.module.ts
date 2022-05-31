import { Module } from '@nestjs/common'
import { CampaignReportService } from './campaign-report.service'
import { CampaignReportController } from './campaign-report.controller'
import { ReportFileService } from '../report-file/report-file.service'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'

@Module({
  controllers: [CampaignReportController],
  providers: [CampaignReportService, PrismaService, ReportFileService, S3Service],
})
export class CampaignReportModule {}
