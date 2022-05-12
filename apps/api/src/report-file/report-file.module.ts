import { Module } from '@nestjs/common'
import { ReportFileService } from './report-file.service'
import { ReportFileController } from './report-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { SupportService } from '../support/support.service'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { CampaignReportService } from '../campaign-report/campaign-report.service'
import { ConfigService } from '@nestjs/config'

@Module({
  imports: [ConfigService],
  controllers: [ReportFileController],
  providers: [
    ReportFileService,
    CampaignReportService,
    PrismaService,
    S3Service,
    PersonService,
    ConfigService,
  ],
})
export class ReportFileModule {}
