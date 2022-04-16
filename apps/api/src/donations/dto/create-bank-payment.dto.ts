import { ApiProperty } from '@nestjs/swagger'
import { Currency, DonationStatus, DonationType, PaymentProvider, Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEmail, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateBankPaymentDto {
  @Expose()
  @ApiProperty({ enum: Currency })
  currency: Currency

  @Expose()
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number

  @Expose()
  @ApiProperty()
  @IsString()
  extCustomerId: string

  @Expose()
  @ApiProperty()
  @IsString()
  extPaymentIntentId: string

  @Expose()
  @ApiProperty()
  @IsString()
  extPaymentMethodId: string

  @Expose()
  @ApiProperty()
  @IsString()
  @IsUUID()
  targetVaultId: string

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  personsFirstName: string | null

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  personsLastName: string | null

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEmail()
  personsEmail: string | null

  public toEntity(): Prisma.DonationCreateInput {
    const donation: Prisma.DonationCreateInput = {
      type: DonationType.donation,
      status: DonationStatus.succeeded,
      provider: PaymentProvider.bank,
      currency: this.currency,
      amount: this.amount,
      extCustomerId: this.extCustomerId,
      extPaymentIntentId: this.extPaymentIntentId,
      extPaymentMethodId: this.extPaymentMethodId,
      targetVault: {
        connect: {
          id: this.targetVaultId,
        },
      },
    }

    if (this.personsEmail && this.personsFirstName && this.personsLastName) {
      donation.person = {
        connectOrCreate: {
          where: {
            email: this.personsEmail,
          },
          create: {
            firstName: this.personsFirstName,
            lastName: this.personsLastName,
            email: this.personsEmail,
          },
        },
      }
    }

    return donation
  }
}
