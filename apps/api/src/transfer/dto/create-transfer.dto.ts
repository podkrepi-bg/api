import { Expose, Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger/dist/decorators'
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'

import { TransferStatus, Currency } from '@prisma/client'

@Expose()
export class CreateTransferDto {
  @ApiProperty({ enum: TransferStatus })
  @Expose()
  @IsEnum(TransferStatus)
  status: TransferStatus

  @ApiProperty({ enum: Currency })
  @Expose()
  @IsEnum(Currency)
  currency: Currency

  @ApiProperty()
  @Expose()
  @IsNumber()
  amount: number

  @ApiProperty()
  @Expose()
  @IsString()
  reason: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  sourceVaultId: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  sourceCampaignId: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  targetVaultId: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  targetCampaignId: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  approvedById?: string | null

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  documentId?: string | null

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  targetDate?: Date | null
}
