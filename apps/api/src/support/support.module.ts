import { Module } from '@nestjs/common'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'

import { PrismaService } from '../prisma/prisma.service'
import { ReportFileService } from '../report-file/report-file.service'
import { S3Service } from '../s3/s3.service'
import { SupportController } from './support.controller'
import { SupportService } from './support.service'

@Module({
  controllers: [SupportController],
  providers: [
    SupportService,
    PrismaService,
    EmailService,
    TemplateService,
    ReportFileService,
    S3Service,
  ],
})
export class SupportModule {}
