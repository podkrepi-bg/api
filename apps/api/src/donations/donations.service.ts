import Stripe from 'stripe'
import { Injectable } from '@nestjs/common'
import { InjectStripeClient } from '@golevelup/nestjs-stripe'

@Injectable()
export class DonationsService {
  constructor(@InjectStripeClient() private stripeClient: Stripe) {}

  async listPrices(type?: Stripe.PriceListParams.Type, active?: boolean): Promise<Stripe.Price[]> {
    const list = await this.stripeClient.prices.list({ active, type })
    return list.data
  }
}
