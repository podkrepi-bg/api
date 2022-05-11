import { Module } from '@nestjs/common'
import { InfoRequestService } from './info-request.service'
import { InfoRequestController } from './info-request.controller'
import { PrismaService } from '../prisma/prisma.service'
import { SupportService } from '../support/support.service'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { ConfigService } from '@nestjs/config'
import { ReportFileService } from '../report-file/report-file.service'
import { S3Service } from '../s3/s3.service'

@Module({
  controllers: [InfoRequestController],
  providers: [
    InfoRequestService,
    PrismaService,
    SupportService,
    EmailService,
    TemplateService,
    ConfigService,
    ReportFileService,
    S3Service,
  ],
})
export class InfoRequestModule {}
