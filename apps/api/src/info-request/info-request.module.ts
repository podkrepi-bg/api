import { Module } from '@nestjs/common'
import { InfoRequestService } from './info-request.service'
import { InfoRequestController } from './info-request.controller'
import { PrismaService } from '../prisma/prisma.service'
import { SupportService } from '../support/support.service'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { ConfigService } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [InfoRequestController],
  providers: [InfoRequestService, SupportService, EmailService, TemplateService, ConfigService],
})
export class InfoRequestModule {}
