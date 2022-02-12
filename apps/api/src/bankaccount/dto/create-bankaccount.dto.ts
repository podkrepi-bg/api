import { ApiProperty } from '@nestjs/swagger'
import { AccountHolderType, BankAccountStatus } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsBIC, IsEnum, IsIBAN, IsOptional, IsString } from 'class-validator'
@Expose()
export class CreateBankaccountDto {
  @ApiProperty({ enum: BankAccountStatus })
  @Expose()
  @IsEnum(BankAccountStatus)
  status: BankAccountStatus

  @ApiProperty()
  @IsString()
  @Expose()
  @IsIBAN()
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
  @IsBIC()
  bankIdCode: string | null

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  fingerprint: string | null
}
