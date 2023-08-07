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
    logLevel: 'debug',
    tracesSampleRate: 1.0,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    sender: process.env.SENDGRID_SENDER_EMAIL,
    internalNotificationsEmail: process.env.SENDGRID_INTERNAL_EMAIL,
    contactsUrl: process.env.SENDGRID_CONTACTS_URL,
    marketingListId: process.env.MARKETING_LIST_ID,
    sendNotifications: process.env.SEND_MARKETING_NOTIFICATIONS,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  paypal: {
    apiUrl: process.env.PAYPAL_URL,
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    webhookId: process.env.PAYPAL_WEBHOOK_ID,
  },
  iris: {
    agentHash: process.env.IRIS_AGENT_HASH,
    userHash: process.env.IRIS_USER_HASH,
    bankBIC: process.env.BANK_BIC,
    platformIBAN: process.env.PLATFORM_IBAN,
    apiUrl: process.env.IRIS_API_URL,
    getConsentEndPoint: process.env.IRIS_API_URL + '/consent',
    checkConsentEndPoint: process.env.IRIS_API_URL + '/consents/{ibanID}',
    banksEndPoint: process.env.IRIS_API_URL + '/banks?country=bulgaria',
    ibansEndPoint: process.env.IRIS_API_URL + '/ibans',
    transactionsEndPoint: process.env.IRIS_API_URL + '/transactions',
    billingAdminEmail: process.env.BILLING_ADMIN_MAIL,
  },
  tasks: {
    import_transactions: { interval: process.env.IMPORT_TRX_TASK_INTERVAL_MINUTES },
  },
})
