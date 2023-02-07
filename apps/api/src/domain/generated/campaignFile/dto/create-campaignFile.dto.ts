
import {CampaignFileRole} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class CreateCampaignFileDto {
  filename: string;
mimetype: string;
@ApiProperty({ enum: CampaignFileRole})
role: CampaignFileRole;
}
