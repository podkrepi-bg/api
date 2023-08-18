import { ApiProperty } from '@nestjs/swagger'
import { CampaignNewsState } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateCampaignNewsDto {
  @ApiProperty()
  @Expose()
  @IsUUID()
  campaignId: string

  @ApiProperty()
  @Expose()
  @IsString()
  slug: string

  @ApiProperty()
  @Expose()
  @IsString()
  title: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsUUID()
  publisherId: string

  @ApiProperty()
  @Expose()
  @IsString()
  author: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  sourceLink: string | null

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  @IsEnum(CampaignNewsState)
  state: CampaignNewsState

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsDate()
  publishedAt: Date | null

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsDate()
  editedAt: Date | null

  @ApiProperty()
  @Expose()
  @IsString()
  description: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsBoolean()
  notify?: boolean
}
