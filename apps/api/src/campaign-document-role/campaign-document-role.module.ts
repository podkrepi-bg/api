import { Module } from '@nestjs/common'
import { CampaignDocumentRoleService } from './campaign-document-role.service'
import { CampaignDocumentRoleController } from './campaign-document-role.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [CampaignDocumentRoleController],
  providers: [CampaignDocumentRoleService, PrismaService],
})
export class CampaignDocumentRoleModule {}
