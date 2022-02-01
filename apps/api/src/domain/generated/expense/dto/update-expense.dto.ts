
import {ExpenseType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateExpenseDto {
  @ApiProperty({ enum: ExpenseType})
type?: ExpenseType;
description?: string;
}
