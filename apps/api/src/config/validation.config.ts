import { INestApplication, ValidationPipe } from '@nestjs/common'
import Joi from 'joi'

export function setupValidation(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  )
}

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5010),
  DATABASE_URL: Joi.string().required(),
})
