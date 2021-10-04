import { Prisma, Currency } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateWithdrawalDto {
  @ApiProperty({ enum: Currency })
  currency?: Currency
  amount?: Prisma.Decimal
  reason?: string
  documentId?: string
  targetDate?: Date
}
