/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { setupCors } from './config/cors.config'
import { setupSwagger } from './config/swagger.config'
import { setupExceptions } from './config/exceptions.config'
import { setupValidation } from './config/validation.config'
import { setupShutdownHooks } from './config/shutdown.config'
import { setupHelmet } from './config/helmet.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'log', 'verbose', 'warn'],
  })
  const globalPrefix = 'api'
  app.setGlobalPrefix(globalPrefix)
  app.enableVersioning({ type: VersioningType.URI })

  setupHelmet(app)
  setupCors(app)
  setupSwagger(app)
  setupExceptions(app)
  setupValidation(app)
  setupShutdownHooks(app)

  const port = process.env.PORT || 3310
  await app.listen(port, () => {
    Logger.log('Listening at http://localhost:' + port + '/' + globalPrefix)
    Logger.log('Swagger Docs at http://localhost:' + port + '/docs')
  })
}

bootstrap()
