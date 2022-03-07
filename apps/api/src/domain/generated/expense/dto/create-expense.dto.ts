import { ExpenseType, ExpenseStatus } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CreateExpenseDto {
  @ApiProperty({ enum: ExpenseType })
  type: ExpenseType
  @ApiProperty({ enum: ExpenseStatus })
  status: ExpenseStatus
  description?: string
}
