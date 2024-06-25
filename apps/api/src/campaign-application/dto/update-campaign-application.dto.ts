import { PartialType } from '@nestjs/swagger'
import { CreateCampaignApplicationDto } from './create-campaign-application.dto'

export class UpdateCampaignApplicationDto extends PartialType(CreateCampaignApplicationDto) {}
