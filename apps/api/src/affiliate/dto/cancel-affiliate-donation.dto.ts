import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString, IsUUID } from 'class-validator'

export class CancelAffiliateDonation {
  @ApiProperty()
  @Expose()
  @IsUUID()
  @IsString()
  donationId: string
}
