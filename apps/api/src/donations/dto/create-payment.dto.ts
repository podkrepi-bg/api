import { ApiProperty } from '@nestjs/swagger'
import {
  Currency,
  DonationStatus,
  DonationType,
  PaymentProvider,
  Person,
  Prisma,
  Vault,
} from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'

@Expose()
export class CreatePaymentDto {
  @Expose()
  @ApiProperty({ enum: DonationType })
  type: DonationType

  @Expose()
  @ApiProperty({ enum: DonationStatus })
  status: DonationStatus

  @Expose()
  @ApiProperty({ enum: PaymentProvider })
  provider: PaymentProvider

  @Expose()
  @ApiProperty({ enum: Currency })
  currency: Currency

  @Expose()
  @ApiProperty()
  @IsNumber()
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

  public toEntity(user): Prisma.DonationCreateInput {
    return {
      type: this.type,
      status: this.status,
      provider: this.provider,
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
      person: {
        connectOrCreate: {
          where: {
            email: user.email,
          },
          create: {
            firstName: user.given_name,
            lastName: user.family_name,
            email: user.email,
          },
        },
      },
    }
  }
}
