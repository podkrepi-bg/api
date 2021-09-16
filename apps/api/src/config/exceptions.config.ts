import { INestApplication } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'

import { PrismaClientExceptionFilter } from '../prisma/prisma-client-exception.filter'

export function setupExceptions(app: INestApplication): void {
  const { httpAdapter } = app.get(HttpAdapterHost)
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter))
}
