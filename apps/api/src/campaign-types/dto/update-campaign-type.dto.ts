import { PartialType } from '@nestjs/swagger';
import { CreateCampaignTypeDto } from './create-campaign-type.dto';

export class UpdateCampaignTypeDto extends PartialType(CreateCampaignTypeDto) {}
