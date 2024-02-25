import { ApiProperty } from '@nestjs/swagger'
import { Currency, PaymentStatus, PaymentProvider, PaymentType, Donation } from '@prisma/client'
import { Expose } from 'class-transformer'

export class DonationBaseDto {
  @ApiProperty()
  @Expose()
  id: string

  @ApiProperty()
  @Expose()
  type: PaymentType

  @ApiProperty()
  @Expose()
  status: PaymentStatus

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
  donations: Donation[]
}

export class ListDonationsDto<T> {
  @ApiProperty()
  items: T[]

  @ApiProperty()
  total: number
}
