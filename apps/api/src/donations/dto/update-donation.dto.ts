import { ApiProperty } from '@nestjs/swagger'
import { DonationType } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'

export class UpdateDonationDto {
  @Expose()
  @ApiProperty({ enum: DonationType })
  @IsEnum(DonationType)
  type: DonationType
}
