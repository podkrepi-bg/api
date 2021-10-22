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
  stripe: {
    apikey: process.env.STRIPE_APIKEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
})
