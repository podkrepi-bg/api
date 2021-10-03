import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { Currency, Prisma } from '.prisma/client'

@Expose()
export class CreateCampaignDto {
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
  @IsString()
  essence: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  coordinatorId: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  beneficiaryId: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  campaignTypeId: string

  @ApiProperty()
  @IsOptional()
  @Expose()
  @IsString()
  description: string

  @ApiProperty()
  @IsOptional()
  @Expose()
  @IsNumber()
  @IsPositive()
  @Max(500000)
  targetAmount: number

  @ApiProperty()
  @IsOptional()
  @Expose()
  @IsNumber()
  @IsPositive()
  @Max(500000)
  reachedAmount: number

  @ApiProperty()
  @IsOptional()
  @Expose()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @IsEnum(Currency)
  currency: Currency

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate: Date | null

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate: Date | null

  public toEntity(): Prisma.CampaignCreateInput {
    return {
      title: this.title,
      slug: this.slug,
      description: this.description,
      essence: this.essence,
      currency: this.currency,
      targetAmount: this.targetAmount,
      coordinatorId: this.coordinatorId,
      startDate: this.startDate,
      endDate: this.endDate,
      campaignTypes: { connect: { id: this.campaignTypeId } },
      beneficiaries: { connect: { id: this.beneficiaryId } },
    }
  }
}
