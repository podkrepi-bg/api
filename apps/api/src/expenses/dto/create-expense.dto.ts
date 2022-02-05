import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { Currency, Prisma, ExpenseType, Vault, Person } from '.prisma/client'
@Expose()
export class CreateExpenseDto {
	@ApiProperty()
	@Expose()
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
	@IsOptional()
	description: string

	@ApiProperty()
	@Expose()
	@IsOptional()
	vaultId: string

	@ApiProperty()
	@Expose()
	@IsOptional()
	documentId: string

	@ApiProperty()
	@Expose()
	@IsOptional()
	approvedById: string

	@ApiProperty()
	@Expose()
	@IsOptional()
	vault: Vault

	@ApiProperty()
	@Expose()
	@IsOptional()
	approvedBy: Person

	@ApiProperty()
	@Expose()
	@IsOptional()
	document: Document
}
