import { ApiProperty } from '@nestjs/swagger'
import {
  Currency,
  DonationType,
  PaymentProvider,
  PaymentStatus,
  PaymentType,
  Prisma,
} from '@prisma/client'
import { Expose, Type } from 'class-transformer'
import {
  Equals,
  IsBoolean,
  IsEnum,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { randomUUID } from 'crypto'
import { DonationMetadataDto } from '../../donations/dto/donation-metadata.dto'

export class CreateAffiliateDonationDto {
  @ApiProperty()
  @Expose()
  @IsUUID()
  @IsString()
  campaignId: string

  @IsEnum(DonationType)
  type: DonationType = DonationType.corporate

  affiliateId: string

  personId: string | null

  @IsString()
  extPaymentIntentId: string = 'pi_' + randomUUID()

  @IsString()
  @IsOptional()
  extPaymentMethodId = 'affiliate'

  @ApiProperty()
  @Expose()
  @IsEnum(Currency)
  //Only BGN is accepted for now
  @Equals(Currency.BGN)
  @IsOptional()
  @IsString()
  currency: Currency = Currency.BGN

  @ApiProperty()
  @Expose()
  @IsNumber()
  amount: number

  billingName: string | null

  billingEmail: string | null

  @ApiProperty()
  @Expose()
  @IsBoolean()
  isAnonymous: boolean

  @ApiProperty()
  @Expose()
  @IsUUID()
  @IsString()
  @IsOptional()
  extCustomerId: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  message?: string

  @ApiProperty()
  @Expose()
  @ValidateIf((req) => typeof req.metadata !== 'undefined')
  @IsNotEmptyObject({ nullable: true })
  @Type(() => DonationMetadataDto)
  @ValidateNested({ each: true })
  metadata: DonationMetadataDto | undefined

  public toEntity(targetVaultId: string): Prisma.PaymentsCreateInput {
    return {
      type: PaymentType.single,
      status: PaymentStatus.guaranteed,
      provider: PaymentProvider.bank,
      currency: this.currency,
      amount: this.amount,
      extCustomerId: this.extCustomerId ?? '',
      extPaymentIntentId: this.extPaymentIntentId,
      extPaymentMethodId: this.extPaymentMethodId ?? '',
      billingEmail: this.billingEmail,
      billingName: this.billingName,
      donations: {
        create: {
          type: DonationType.corporate,
          amount: this.amount,

          person:
            this.isAnonymous === false && this.billingEmail
              ? { connect: { email: this.billingEmail } }
              : {},

          targetVault: {
            connect: {
              id: targetVaultId,
            },
          },
        },
      },
      affiliate: this.affiliateId ? { connect: { id: this.affiliateId } } : {},
    }
  }
}
