import { StripeModuleConfig } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { Public } from 'nest-keycloak-connect'

export const StripeConfigFactory = {
  useFactory: async (config: ConfigService) =>
    ({
      apiVersion: '2025-12-15.clover',
      appInfo: {
        name: 'Podkrepi.bg open charity platform',
        url: 'https://podkrepi.bg',
      },
      apiKey: config.get('stripe.secretKey', ''),
      maxNetworkRetries: 2,
      webhookConfig: {
        stripeWebhookSecret: config.get('stripe.webhookSecret', ''),
        requestBodyProperty: 'body',
        decorators: [
          /**
           * Avoid Keycloak @AuthGuard and @RoleGuard on Webhook controller
           **/
          Public(),
        ],
        stripeSecrets: {
          connect: config.get('stripe.webhookSecret', ''),
          account: config.get('stripe.webhookSecret', ''),
          accountTest: config.get('stripe.webhookSecret', ''),
          connectTest: config.get('stripe.webhookSecret', ''),
        },
      },
    } as StripeModuleConfig),
}
