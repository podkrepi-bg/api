import Joi from 'joi'
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common'
import { useContainer } from 'class-validator'

import { AppModule } from '../app/app.module'

const globalValidationPipe = new ValidationPipe({
  transform: true,
  transformOptions: {
    strategy: 'exposeAll',
    excludeExtraneousValues: true,
  },
  stopAtFirstError: false,
  forbidUnknownValues: true,
  disableErrorMessages: false,
  exceptionFactory: (errors) => new BadRequestException(errors),
  validationError: { target: false, value: false },
})

export function setupValidation(app: INestApplication): void {
  // https://github.com/typestack/class-validator#using-service-container
  useContainer(app.select(AppModule), { fallbackOnErrors: true })

  app.useGlobalPipes(globalValidationPipe)
}

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5010),
  DATABASE_URL: Joi.string().required(),
})
