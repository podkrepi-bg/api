import { Module } from '@nestjs/common'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'

import { PrismaService } from '../prisma/prisma.service'
import { SupportController } from './support.controller'
import { SupportService } from './support.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [SupportController],
  providers: [SupportService, PrismaService, EmailService, TemplateService],
})
export class SupportModule {}
