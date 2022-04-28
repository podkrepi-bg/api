import { ApiProperty } from '@nestjs/swagger'
import { RecurringDonationStatus, Currency, Person, Vault, Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEnum, IsNumber, IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateRecurringDonationDto {
  @ApiProperty({ enum: RecurringDonationStatus })
  @Expose()
  @IsEnum(RecurringDonationStatus)
  status: RecurringDonationStatus

  // @ApiProperty()
  // @IsUUID()
  // @Expose()
  // vaultId: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  personId: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  campaignId: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsUUID()
  extSubscriptionId: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  extCustomerId: string

  @ApiProperty()
  @Expose()
  @IsNumber()
  amount: number

  @ApiProperty({ enum: Currency })
  @Expose()
  @IsEnum(Currency)
  currency: Currency

  @ApiProperty()
  @Expose()
  @IsUUID()
  sourceVault: string

  public toEntity(): Prisma.RecurringDonationCreateInput {
    return {
      status: this.status,
      extSubscriptionId: this.extSubscriptionId,
      extCustomerId: this.extCustomerId,
      campaignId: this.campaignId,
      amount: this.amount,
      currency: this.currency,
      sourceVault: {
        connect: {
          id: this.sourceVault,
        },
      },
      person: {
        connect: { id: this.personId },
      },
    }
  }
}
