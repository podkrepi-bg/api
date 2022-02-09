import Stripe from "stripe";
import { Injectable, NotAcceptableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectStripeClient } from "@golevelup/nestjs-stripe";

import { DonationMetadata } from "./dontation-metadata.interface";
import { CampaignService } from "../campaign/campaign.service";
import { CreateSessionDto } from "./dto/create-session.dto";

@Injectable()
export class DonationsService {
  constructor(
    @InjectStripeClient() private stripeClient: Stripe,
    private config: ConfigService,
    private campaignServie: CampaignService
  ) {}

  async listPrices(
    type?: Stripe.PriceListParams.Type,
    active?: boolean
  ): Promise<Stripe.Price[]> {
    const list = await this.stripeClient.prices.list({ active, type });
    return list.data;
  }

  async createCheckoutSession(
    sessionDto: CreateSessionDto
  ): Promise<{ session: Stripe.Checkout.Session }> {
    await this.validateCampaign(sessionDto);

    const appUrl = this.config.get<string>("APP_URL");
    const mode = sessionDto.mode;
    const metadata: DonationMetadata = {
      campaignId: sessionDto.campaignId,
    };

    const session = await this.stripeClient.checkout.sessions.create({
      mode,
      line_items: [{ price: sessionDto.priceId, quantity: 1 }],
      payment_method_types: ["card"],
      payment_intent_data: mode === "payment" ? { metadata } : undefined,
      subscription_data: mode === "subscription" ? { metadata } : undefined,
      success_url: sessionDto.successUrl ?? `${appUrl}/success`,
      cancel_url: sessionDto.cancelUrl ?? `${appUrl}/canceled`,
      tax_id_collection: {
        enabled: true,
      },
    });
    return { session };
  }

  async validateCampaign(sessionDto: CreateSessionDto) {
    const canAcceptDonation = await this.campaignServie.canAcceptDonations(
      sessionDto.campaignId
    );
    if (canAcceptDonation) {
      return true;
    }

    throw new NotAcceptableException("This campaign cannot accept donations");
  }
}
