import { PaymentType } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CreatePaymentDto {
  extCustomerId: string
  extPaymentIntentId: string
  extPaymentMethodId: string
  @ApiProperty({ enum: PaymentType })
  type: PaymentType
  billingEmail?: string
  billingName?: string
}
