import { ApiProperty } from '@nestjs/swagger'
import {
  Currency,
  Donation,
  Expense,
  Prisma,
  RecurringDonation,
  Transfer,
  Withdrawal,
} from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsOptional, IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateVaultDto {
  @Expose()
  @ApiProperty({ enum: Currency })
  currency: Currency

  @Expose()
  @IsString()
  @ApiProperty()
  name: string

  @Expose()
  @ApiProperty()
  @IsString()
  @IsUUID()
  campaignId: string

  @Expose()
  @ApiProperty()
  @IsOptional()
  expenses?: Expense[]

  @Expose()
  @ApiProperty()
  @IsOptional()
  sourceTransfers?: Transfer[]

  @Expose()
  @ApiProperty()
  @IsOptional()
  targetTransfers?: Transfer[]

  @Expose()
  @ApiProperty()
  @IsOptional()
  donations?: Donation[]

  @Expose()
  @ApiProperty()
  @IsOptional()
  withdraws?: Withdrawal[]

  @Expose()
  @ApiProperty()
  @IsOptional()
  recurringDonations?: RecurringDonation[]

  public toEntity(): Prisma.VaultCreateInput {
    return {
      currency: this.currency,
      name: this.name,
      amount: 0,
      createdAt: new Date(),
      updatedAt: null,
      campaign: {
        connect: {
          id: this.campaignId,
        },
      },
    }
  }
}
