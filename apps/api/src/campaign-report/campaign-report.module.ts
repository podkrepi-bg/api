import { forwardRef, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CampaignModule } from '../campaign/campaign.module'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { VaultModule } from '../vault/vault.module'
import { CampaignReportController } from './campaign-report.controller'
import { CampaignReportService } from './campaign-report.service'

@Module({
  imports: [forwardRef(() => VaultModule), forwardRef(() => CampaignModule)],
  controllers: [CampaignReportController],
  providers: [CampaignReportService, PrismaService, PersonService, ConfigService, S3Service],
  exports: [CampaignReportService],
})
export class CampaignReportModule {}
