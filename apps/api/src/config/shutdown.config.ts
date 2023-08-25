import { INestApplication, ShutdownSignal } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export function setupShutdownHooks(app: INestApplication) {
  // https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions/upgrading-to-prisma-5
  app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGTERM])
}
