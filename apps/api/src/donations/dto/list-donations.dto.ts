import { ApiProperty } from '@nestjs/swagger'
import { Currency, DonationStatus, DonationType, PaymentProvider, Donation } from '@prisma/client'
import { Expose } from 'class-transformer'

export class DonationBaseDto {
  @ApiProperty()
  @Expose()
  id: string

  @ApiProperty()
  @Expose()
  type: DonationType

  @ApiProperty()
  @Expose()
  status: DonationStatus

  @ApiProperty()
  @Expose()
  provider: PaymentProvider

  @ApiProperty()
  @Expose()
  createdAt: Date

  @ApiProperty()
  @Expose()
  updatedAt: Date | null

  @ApiProperty()
  @Expose()
  amount: number

  @ApiProperty()
  @Expose()
  currency: Currency

  @ApiProperty()
  @Expose()
  person: Object | null
}

export class ListDonationsDto<T> {
  @ApiProperty()
  items: T[]

  @ApiProperty()
  total: number
};

