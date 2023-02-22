import { NestFactory } from '@nestjs/core'
import { Logger, LogLevel, VersioningType } from '@nestjs/common'

import { AppModule } from './app/app.module'
import { setupCors } from './config/cors.config'
import { setupHelmet } from './config/helmet.config'
import { setupSwagger } from './config/swagger.config'
import { setupExceptions } from './config/exceptions.config'
import { setupValidation } from './config/validation.config'
import { setupShutdownHooks } from './config/shutdown.config'
import { PostgresIoAdapter } from './sockets/notifications/adapter'

const globalPrefix = process.env.GLOBAL_PREFIX ?? 'api/v1'
const logLevels: LogLevel[] = ['error', 'warn']

async function bootstrap() {
  const isDevConfig = process.env.NODE_ENV === 'development'
  if (isDevConfig) {
    Logger.debug('Running with development configuration')
  }

  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Body parsing is enabled later on via middlewares
    rawBody: true,
    logger: isDevConfig ? ['debug', 'log', 'verbose', ...logLevels] : logLevels,
  })

  app.setGlobalPrefix(globalPrefix)
  app.enableVersioning({ type: VersioningType.URI })

  const postgresIoAdapter = new PostgresIoAdapter(app)
  await postgresIoAdapter.connectToPostgres()
  app.useWebSocketAdapter(postgresIoAdapter)

  const appVersion = process.env.APP_VERSION || 'unknown'
  setupHelmet(app)
  setupCors(app)
  setupSwagger(app, appVersion)
  setupExceptions(app)
  setupValidation(app)
  setupShutdownHooks(app)

  const port = process.env.PORT || 3310
  await app.listen(port, () => {
    Logger.debug(`Listening at http://localhost:${port}/${globalPrefix}`, 'bootstrap')
    Logger.debug(`Swagger Docs at http://localhost:${port}/swagger`, 'bootstrap')
  })
}

bootstrap()
