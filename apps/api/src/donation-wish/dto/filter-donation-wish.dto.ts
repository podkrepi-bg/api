import { ApiQuery } from '@nestjs/swagger'
import { applyDecorators } from '@nestjs/common'

export function DonationWishQueryDecorator() {
  return applyDecorators(
    ApiQuery({ name: 'campaignId', required: false, type: String }),
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
    ApiQuery({ name: 'sortOrder', required: false, type: String }),
  )
}
