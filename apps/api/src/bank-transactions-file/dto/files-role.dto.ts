import { ApiProperty } from '@nestjs/swagger'
import { BankTransactionsFileRole } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'

export class FilesRoleDto {
  @ApiProperty()
  @Expose()
  @IsEnum(BankTransactionsFileRole, { each: true })
  roles: BankTransactionsFileRole[]
}
