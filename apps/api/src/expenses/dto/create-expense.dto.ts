import {
  IsEnum,
  IsNumber,
  IsOptional,
  isString,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { Currency, Prisma, ExpenseType, ExpenseStatus } from '.prisma/client'

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

  // public toEntity(): Prisma.ExpenseCreateInput {
  // 	return {
  // 		type: this.type,
  // 		currency: this.currency,
  // 		amount: this.amount,
  // 		description: this.description,
  // 		vault: { connect: { id: this.vaultId } },
  // 		documentId: this.documentId,
  // 		approvedById: this.approvedById
  // 	}
  // }
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
