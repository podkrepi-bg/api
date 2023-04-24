import { AuthGuard } from 'nest-keycloak-connect'
import { ExecutionContext, Logger } from '@nestjs/common'
import { extractRequest } from 'nest-keycloak-connect/util'

export class CustomAuthGuard extends AuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const [request] = extractRequest(context)

    if (!request) {
      //As recommended by https://github.com/golevelup/nestjs/tree/master/packages/stripe#usage-with-interceptors-guards-and-filters
      const contextType = context.getType<'http' | 'stripe_webhook'>()
      if (contextType === 'stripe_webhook') {
        Logger.warn('Skip AuthGuard for Stripe webhook', CustomAuthGuard.name)
        return true
      }
    }

    // Skip auth guard for Stripe routes and pseudo requests
    if (request.url === '/api/stripe/webhook' || request.object === 'event') {
      Logger.warn('Skip AuthGuard for Stripe', CustomAuthGuard.name)
      return true
    }
    return super.canActivate(context)
  }
}
