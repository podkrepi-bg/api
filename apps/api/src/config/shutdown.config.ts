import { INestApplication, ShutdownSignal } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export function setupShutdownHooks(app: INestApplication) {
  const prismaService: PrismaService = app.get(PrismaService)
  prismaService.enableShutdownHooks(app)

  app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGTERM])
}
