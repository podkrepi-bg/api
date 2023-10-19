import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsArray, IsObject, ValidateNested } from 'class-validator'

import { IrisIbanAccountInfoDto } from './iris-bank-account-info.dto'
import { IrisTransactionInfoDto } from './iris-bank-transaction-info.dto'

export class IrisBankTransactionSimulationDto {
  @ApiProperty()
  @Expose()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => IrisIbanAccountInfoDto)
  irisIbanAccountInfo: IrisIbanAccountInfoDto

  @ApiProperty()
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IrisTransactionInfoDto)
  irisTransactionInfo: IrisTransactionInfoDto[]
}
