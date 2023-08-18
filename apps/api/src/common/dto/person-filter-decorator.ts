import { ApiQuery } from '@nestjs/swagger'
import { applyDecorators } from '@nestjs/common'

export function PersonQueryDecorator() {
  return applyDecorators(
    ApiQuery({ name: 'pageindex', required: false, type: Number }),
    ApiQuery({ name: 'pagesize', required: false, type: Number }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'sortBy', required: false, type: String }),
    ApiQuery({ name: 'sortOrder', required: false, type: String }),
  )
}
