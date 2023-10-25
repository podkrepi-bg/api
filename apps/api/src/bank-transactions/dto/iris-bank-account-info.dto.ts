import { ApiProperty } from '@nestjs/swagger'
import { Currency } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsIBAN, IsString } from 'class-validator'

class ConsentDTO {
  consents: [{ status: string }]
  errorCodes: unknown
}

export class IrisIbanAccountInfoDto {
  id: number

  name: string

  @ApiProperty()
  @IsString()
  @IsIBAN()
  @Expose()
  iban: string

  currency: Currency

  hasAuthorization: boolean

  bankHash: string

  @ApiProperty()
  @IsString()
  @Expose()
  bankName: string

  country: string

  dateCreate: number

  consents: ConsentDTO
}
