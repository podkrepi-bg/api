import { ApiProperty } from '@nestjs/swagger'
import { RecurringDonationStatus, Currency, Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEnum, IsNumber, IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateRecurringDonationDto {
  @ApiProperty({ enum: RecurringDonationStatus })
  @Expose()
  @IsEnum(RecurringDonationStatus)
  status: RecurringDonationStatus

  @ApiProperty()
  @Expose()
  @IsUUID()
  personId: string

  @ApiProperty()
  @Expose()
  @IsString()
  extSubscriptionId: string

  @ApiProperty()
  @Expose()
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

  @ApiProperty()
  @Expose()
  @IsUUID()
  campaignId: string

  public toEntity(): Prisma.RecurringDonationCreateInput {
    return {
      status: this.status,
      extSubscriptionId: this.extSubscriptionId,
      extCustomerId: this.extCustomerId,
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
