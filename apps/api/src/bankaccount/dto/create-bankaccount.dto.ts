import { ApiProperty } from '@nestjs/swagger'
import { AccountHolderType, BankAccountStatus } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Withdrawal } from '../../domain/generated/withdrawal/entities/withdrawal.entity'
@Expose()
export class CreateBankaccountDto {
  @ApiProperty({ enum: BankAccountStatus })
  @Expose()
  @IsEnum(BankAccountStatus)
  status: BankAccountStatus

  @ApiProperty()
  @IsString()
  @Expose()
  ibanNumber: string

  @ApiProperty()
  @Expose()
  @IsString()
  accountHolderName: string

  @ApiProperty({ enum: AccountHolderType })
  @Expose()
  @IsEnum(AccountHolderType)
  accountHolderType: AccountHolderType

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  bankName: string | null

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  bankIdCode: string | null

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  fingerprint: string | null

  @ApiProperty()
  withdraws?: Withdrawal[]
}
