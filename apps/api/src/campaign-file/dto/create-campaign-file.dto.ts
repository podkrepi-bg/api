import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator'

export class CreateCampaignFileDto {
  filename: string
  campaignId: string
}
