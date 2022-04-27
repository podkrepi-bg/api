import { LogLevel } from '@sentry/types'

/**
 * Be sure to add `process.env` vars in validation schema at ./validation.config.ts
 */
export default () => ({
  keycloak: {
    serverUrl: process.env.KEYCLOAK_URL,
    realm: process.env.KEYCLOAK_REALM,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    secret: process.env.KEYCLOAK_SECRET,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.APP_ENV,
    debug: false,
    enabled: process.env.APP_ENV !== 'development',
    logLevel: LogLevel.Debug,
    tracesSampleRate: 1.0,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    sender: process.env.SENDGRID_SENDER_EMAIL,
    internalNotificationsEmail: process.env.SENDGRID_INTERNAL_EMAIL,
    contactsUrl: process.env.SENDGRID_CONTACTS_URL,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
})
