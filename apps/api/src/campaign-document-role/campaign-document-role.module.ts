import { Module } from '@nestjs/common';
import { CampaignDocumentRoleService } from './campaign-document-role.service';
import { CampaignDocumentRoleController } from './campaign-document-role.controller';

@Module({
  controllers: [CampaignDocumentRoleController],
  providers: [CampaignDocumentRoleService]
})
export class CampaignDocumentRoleModule {}
