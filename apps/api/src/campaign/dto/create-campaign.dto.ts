import { IsDate, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform, Type } from 'class-transformer'
import { CampaignState, Currency, Prisma } from '@prisma/client'
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
  organizerId: string

  @ApiProperty()
  @IsOptional()
  @Expose()
  @IsUUID()
  companyId: string | null

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
  reachedAmount: number

  @ApiProperty()
  @Expose()
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
  @Transform((field) => (field.value != '' ? new Date(field.value) : null))
  @IsDate()
  endDate: Date | null

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  @IsEnum(CampaignState)
  state: CampaignState | undefined

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
      state: this.state,
      vaults: { create: { currency: this.currency, name: this.title } },
      campaignType: { connect: { id: this.campaignTypeId } },
      beneficiary: { connect: { id: this.beneficiaryId } },
      coordinator: { connect: { id: this.coordinatorId } },
      organizer: { connect: { id: this.organizerId } },
      // company: { connect: { id: this.companyId } }, // uncomment when this one gets fixed: https://github.com/podkrepi-bg/frontend/issues/1087
    }
  }
}
