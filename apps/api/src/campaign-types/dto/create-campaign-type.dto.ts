import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsOptional, IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateCampaignTypeDto {
  @ApiProperty()
  @IsString()
  name: string
  @ApiProperty()
  slug: string
  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string
  @ApiProperty()
  @IsUUID()
  @IsOptional()
  parentId?: string
}
