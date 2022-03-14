import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsOptional, IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateCampaignTypeDto {
  @ApiProperty()
  @IsString()
  @Expose()
  name: string
  @ApiProperty()
  @IsString()
  @Expose()
  slug: string
  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  description?: string
  @ApiProperty()
  @IsUUID()
  @IsOptional()
  @Expose()
  parentId?: string
}
