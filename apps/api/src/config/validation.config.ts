import Joi from 'joi'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { useContainer } from 'class-validator'

import { AppModule } from '../app/app.module'

export function setupValidation(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: false,
      disableErrorMessages: false,
      transformOptions: {
        strategy: 'excludeAll',
        excludeExtraneousValues: true,
      },
      validationError: { target: true, value: true },
    }),
  )

  // https://github.com/typestack/class-validator#using-service-container
  useContainer(app.select(AppModule), { fallbackOnErrors: true })
}

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5010),
  DATABASE_URL: Joi.string().required(),
})
