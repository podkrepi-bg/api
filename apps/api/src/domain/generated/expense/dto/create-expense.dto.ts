
import {ExpenseType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class CreateExpenseDto {
  @ApiProperty({ enum: ExpenseType})
type: ExpenseType;
description?: string;
}
