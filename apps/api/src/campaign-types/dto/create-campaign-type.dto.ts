import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateCampaignTypeDto {
  @ApiProperty()
  @IsString()
  name: string
  @ApiProperty()
  @IsString()
  slug: string
  @ApiProperty()
  @IsString()
  description?: string
}
