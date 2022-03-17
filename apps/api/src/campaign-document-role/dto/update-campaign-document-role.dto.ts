import { PartialType } from '@nestjs/swagger'
import { CreateCampaignDocumentRoleDto } from './create-campaign-document-role.dto'

export class UpdateCampaignDocumentRoleDto extends PartialType(CreateCampaignDocumentRoleDto) {}
