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
import { getPaymentReference } from '../helpers/payment-reference'

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
  @IsOptional()
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
  allowDonationOnComplete: boolean

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
      paymentReference: getPaymentReference(),
      currency: this.currency,
      targetAmount: this.targetAmount,
      allowDonationOnComplete: this.allowDonationOnComplete,
      startDate: this.startDate,
      endDate: this.endDate,
      vaults: { create: { currency: this.currency, name: this.title } },
      campaignType: { connect: { id: this.campaignTypeId } },
      beneficiary: { connect: { id: this.beneficiaryId } },
      coordinator: { connect: { id: this.coordinatorId } },
    }
  }
}
