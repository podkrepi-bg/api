import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsBoolean, IsEmail } from 'class-validator'

export class CampaignSubscribeDto {
  @ApiProperty()
  @Expose()
  @IsEmail()
  email: string

  @ApiProperty()
  @Expose()
  @IsBoolean()
  consent: boolean
}
