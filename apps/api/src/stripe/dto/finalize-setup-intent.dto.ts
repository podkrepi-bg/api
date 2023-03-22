import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEnum, IsNumber } from 'class-validator'
import { Currency } from '@prisma/client'

export class FinalizeSetupIntentDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  amount: number

  @ApiProperty()
  @Expose()
  @IsEnum(Currency)
  currency: Currency
}
