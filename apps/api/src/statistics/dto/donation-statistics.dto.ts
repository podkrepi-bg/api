import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class GroupedDonationsDto {
  @ApiProperty()
  @Expose()
  sum: number

  @ApiProperty()
  @Expose()
  count: number

  @ApiProperty()
  @Expose()
  date: Date
}

export class UniqueDonationsDto {
  @ApiProperty()
  @Expose()
  amount: number

  @ApiProperty()
  @Expose()
  count: number
}

export class HourlyDonationsDto {
  @ApiProperty()
  @Expose()
  hour: number

  @ApiProperty()
  @Expose()
  count: number
}
