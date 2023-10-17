import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

@Expose()
export class CampaignSummaryDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  reachedAmount: number

  @ApiProperty()
  guaranteedAmount: number

  @ApiProperty()
  currentAmount: number

  @ApiProperty()
  blockedAmount: number

  @ApiProperty()
  withdrawnAmount: number

  @ApiProperty()
  donors: number
}
