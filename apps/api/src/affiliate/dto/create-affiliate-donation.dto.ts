import { ApiProperty } from '@nestjs/swagger'
import { Currency, DonationStatus, DonationType, PaymentProvider, Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { Equals, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'
import { randomUUID } from 'crypto'

export class CreateAffiliateDonation {
  @ApiProperty()
  @Expose()
  @IsUUID()
  @IsString()
  campaignId: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  @IsString()
  @IsOptional()
  affiliateId: string | null = null

  @IsUUID()
  @IsString()
  @IsOptional()
  personId: string | null = null

  @IsString()
  extPaymentIntentId: string = 'pi_' + randomUUID()

  @IsString()
  @IsOptional()
  extPaymentMethodId: string = 'pm_' + randomUUID()

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

  @ApiProperty()
  @Expose()
  @IsString()
  billingName: string

  @IsString()
  @IsOptional()
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

  public toEntity(targetVaultId: string): Prisma.DonationCreateInput {
    return {
      type: DonationType.donation,
      status: DonationStatus.guaranteed,
      provider: PaymentProvider.bank,
      currency: this.currency,
      amount: this.amount,
      extCustomerId: this.extCustomerId ?? '',
      extPaymentIntentId: this.extPaymentIntentId,
      extPaymentMethodId: this.extPaymentMethodId ?? '',
      billingEmail: this.billingEmail,
      billingName: this.billingName,
      targetVault: {
        connect: {
          id: targetVaultId,
        },
      },
      affiliate: this.affiliateId ? { connect: { id: this.affiliateId } } : {},
      person:
        this.isAnonymous === false && this.billingEmail
          ? { connect: { email: this.billingEmail } }
          : {},
    }
  }
}
