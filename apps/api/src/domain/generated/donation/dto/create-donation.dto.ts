import { DonationType } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CreateDonationDto {
  @ApiProperty({ enum: DonationType })
  type: DonationType
}
