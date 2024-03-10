import { DonationType } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateDonationDto {
  @ApiProperty({ enum: DonationType })
  type?: DonationType
}
