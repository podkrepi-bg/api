import { ApiProperty } from '@nestjs/swagger'
import { BankTransactionsFileType } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'

export class FilesTypesDto {
  @ApiProperty()
  @Expose()
  @IsEnum(BankTransactionsFileType, { each: true })
  types: BankTransactionsFileType[]
}
