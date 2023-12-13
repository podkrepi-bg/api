import Joi from 'joi'
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common'
import { useContainer } from 'class-validator'

import { AppModule } from '../app/app.module'

const globalValidationPipe = new ValidationPipe({
  transform: true,
  transformOptions: {
    strategy: 'exposeAll',
    excludeExtraneousValues: true,
    exposeDefaultValues: true,
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
  APP_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  APP_URL: Joi.string().uri(),
  PORT: Joi.number().default(5010),

  // Sentry
  SENTRY_DSN: Joi.string().required(),

  // Prisma
  DATABASE_URL: Joi.string().required(),

  // Keycloak
  KEYCLOAK_URL: Joi.string().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  KEYCLOAK_CLIENT_ID: Joi.string().required(),
  KEYCLOAK_SECRET: Joi.string().required(),

  // SendGrid
  SENDGRID_API_KEY: Joi.string().allow('').optional(),
  SENDGRID_SENDER_EMAIL: Joi.string().email().required(),
  SENDGRID_INTERNAL_EMAIL: Joi.string().email().required(),
  SENDGRID_CONTACTS_URL: Joi.string().required(),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),

  //Paypal
  PAYPAL_URL: Joi.string().required(),
  PAYPAL_CLIENT_ID: Joi.string().required(),
  PAYPAL_CLIENT_SECRET: Joi.string().required(),
  PAYPAL_WEBHOOK_ID: Joi.string().required(),
})
