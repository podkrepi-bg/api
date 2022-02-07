import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { Currency, ExpenseType, ExpenseStatus } from '.prisma/client'

@Expose()
export class CreateExpenseDto {
  @ApiProperty()
  @Expose()
  @IsString()
  type: ExpenseType

  @ApiProperty()
  @Expose()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @IsEnum(Currency)
  currency: Currency

  @ApiProperty()
  @Expose()
  @IsNumber()
  amount: number

  @ApiProperty()
  @Expose()
  @IsString()
  status: ExpenseStatus

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  description: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  vaultId: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  @IsOptional()
  documentId?: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  @IsOptional()
  approvedById?: string
}

//expense->vault ---> one-

// id?: string
// type: ExpenseType
// currency?: Currency
// amount?: number
// description?: string | null
// vault: VaultCreateNestedOneWithoutExpensesInput
// approvedBy?: PersonCreateNestedOneWithoutExpensesInput
// document?: DocumentCreateNestedOneWithoutExpensesInput
