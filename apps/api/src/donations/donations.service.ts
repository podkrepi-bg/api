import Stripe from 'stripe'
import { Injectable } from '@nestjs/common'
import { InjectStripeClient } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class DonationsService {
  constructor(@InjectStripeClient() private stripeClient: Stripe, private config: ConfigService) {}

  async listPrices(type?: Stripe.PriceListParams.Type, active?: boolean): Promise<Stripe.Price[]> {
    const list = await this.stripeClient.prices.list({ active, type })
    return list.data
  }

  async createCheckoutSession(
    priceId: string,
    metadata: { campaignId: string },
    mode: Stripe.Checkout.Session.Mode,
  ): Promise<{ session: Stripe.Checkout.Session }> {
    const appUrl = this.config.get<string>('APP_URL')
    const session = await this.stripeClient.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_types: ['card'],
      payment_intent_data: mode === 'payment' ? {} : undefined,
      success_url: `${appUrl}/success`,
      cancel_url: `${appUrl}/canceled`,
    })
    return { session }
  }
}
