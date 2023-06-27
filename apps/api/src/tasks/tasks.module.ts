import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { DonationsModule } from '../donations/donations.module'
import { PrismaService } from '../prisma/prisma.service'
import { IrisTasks } from './bank-import/import-transactions.task'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { TasksInitializer } from './tasks-initializer.service'

@Module({
  imports: [HttpModule, DonationsModule],
  providers: [IrisTasks, PrismaService, EmailService, TemplateService, TasksInitializer],
})
export class TasksModule {}
