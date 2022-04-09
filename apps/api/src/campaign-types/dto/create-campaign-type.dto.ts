import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'
import { CampaignTypeCategory } from '@prisma/client'
@Expose()
export class CreateCampaignTypeDto {
  @ApiProperty({ enum: CampaignTypeCategory })
  @Expose()
  @IsEnum(CampaignTypeCategory)
  category: CampaignTypeCategory

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
  // @IsOptional()
  @Expose()
  description?: string | null
  @ApiProperty()
  @IsUUID()
  @IsOptional()
  @Expose()
  parentId?: string
}
