import { ApiProperty } from '@nestjs/swagger'
import { AffiliateStatus } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEnum, IsString } from 'class-validator'

export class AffiliateStatusUpdateDto {
  @ApiProperty()
  @IsString()
  @Expose()
  @IsEnum(AffiliateStatus)
  newStatus: AffiliateStatus
}
