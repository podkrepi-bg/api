import { ApiQuery } from '@nestjs/swagger'
import { PaymentProvider } from '@prisma/client'
import { applyDecorators } from '@nestjs/common'

export function DonationsApiQuery() {
  return applyDecorators(
    ApiQuery({ name: 'campaignId', required: false, type: String }),
    ApiQuery({ name: 'status', required: false }),
    ApiQuery({
      name: 'provider',
      required: false,
      enum: PaymentProvider,
      description: 'Payment Provider of the donation',
    }),
    ApiQuery({
      name: 'minAmount',
      required: false,
      type: Number,
      description: 'Minimum amount of the donation',
    }),
    ApiQuery({
      name: 'maxAmount',
      required: false,
      type: Number,
      description: 'Maximum amount of the donation',
    }),
    ApiQuery({ name: 'pageindex', required: false, type: Number }),
    ApiQuery({ name: 'pagesize', required: false, type: Number }),
    ApiQuery({ name: 'from', required: false, type: Date }),
    ApiQuery({ name: 'to', required: false, type: Date }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'sortBy', required: false, type: String }),
  )
}
