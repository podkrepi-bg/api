import { Module } from '@nestjs/common'
import { ReportFileService } from './report-file.service'
import { ReportFileController } from './report-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { SupportService } from '../support/support.service'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'

@Module({
  controllers: [ReportFileController],
  providers: [
    ReportFileService,
    PrismaService,
    S3Service,
    PersonService,
    SupportService,
    EmailService,
    TemplateService,
  ],
})
export class ReportFileModule {}
