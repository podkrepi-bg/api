import { ApiProperty } from '@nestjs/swagger'
import {
  Campaign,
  Currency,
  Donation,
  Expense,
  Prisma,
  RecurringDonation,
  Transfer,
  Withdrawal,
} from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsDate, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator'

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
  @IsNumber()
  @ApiProperty()
  amount: number

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
      amount: this.amount,
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
