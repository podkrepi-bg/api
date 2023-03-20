import { StripeModuleConfig } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { Public } from 'nest-keycloak-connect'

export const useFactoryService = {
  useFactory: async (config: ConfigService) =>
    ({
      apiKey: config.get('stripe.secretKey', ''),
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
        },
      },
    } as StripeModuleConfig),
}
