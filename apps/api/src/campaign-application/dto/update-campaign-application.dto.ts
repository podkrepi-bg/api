import { ApiProperty, PartialType } from '@nestjs/swagger'
import { CreateCampaignApplicationDto } from './create-campaign-application.dto'
import { Expose } from 'class-transformer'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { CampaignApplicationState } from '@prisma/client'

export class UpdateCampaignApplicationDto extends PartialType(CreateCampaignApplicationDto) {
  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  state?: CampaignApplicationState

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  ticketURL?: string

  @ApiProperty()
  @Expose()
  @IsBoolean()
  @IsOptional()
  archived?: boolean
}
