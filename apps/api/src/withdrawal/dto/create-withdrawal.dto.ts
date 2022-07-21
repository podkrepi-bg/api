import { ApiProperty } from '@nestjs/swagger'
import { Currency, Prisma, WithdrawStatus } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEnum, IsNumber, IsString, IsUUID, IsOptional } from 'class-validator'
export class CreateWithdrawalDto {
  @ApiProperty({ enum: WithdrawStatus })
  @Expose()
  @IsEnum(WithdrawStatus)
  status: WithdrawStatus

  @ApiProperty({ enum: Currency })
  @Expose()
  @IsEnum(Currency)
  currency: Currency

  @ApiProperty()
  @Expose()
  @IsNumber()
  amount: number

  @ApiProperty()
  @IsString()
  @Expose()
  reason: string

  @ApiProperty()
  @IsUUID()
  @Expose()
  sourceVaultId: string

  @ApiProperty()
  @IsUUID()
  @Expose()
  sourceCampaignId: string

  @ApiProperty()
  @IsUUID()
  @Expose()
  bankAccountId: string

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  @Expose()
  documentId?: string

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  @Expose()
  approvedById?: string
}
