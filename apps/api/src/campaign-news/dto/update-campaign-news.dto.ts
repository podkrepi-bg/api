import { PartialType } from '@nestjs/swagger'
import { CreateCampaignNewsDto } from './create-campaign-news.dto'

export class UpdateCampaignNewsDto extends PartialType(CreateCampaignNewsDto) {}
