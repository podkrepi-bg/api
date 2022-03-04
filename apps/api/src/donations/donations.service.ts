import Stripe from 'stripe'
import { Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectStripeClient } from '@golevelup/nestjs-stripe'

import { DonationMetadata } from './dontation-metadata.interface'
import { CampaignService } from '../campaign/campaign.service'
import { CreateSessionDto } from './dto/create-session.dto'
import { Currency, Donation } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'

type User = {
    given_name: string,
    family_name: string,
    email: String
}

type Vault = {
    id: string,
    currency: Currency,
    amount: number,
    campaign: Object

}

@Injectable()
export class DonationsService {
    constructor(
        @InjectStripeClient() private stripeClient: Stripe,
        private config: ConfigService,
        private campaignServie: CampaignService,
        private prisma: PrismaService
    ) { }

    async listPrices(type?: Stripe.PriceListParams.Type, active?: boolean): Promise<Stripe.Price[]> {
        const list = await this.stripeClient.prices.list({ active, type })
        return list.data
    }

    async createCheckoutSession(
        sessionDto: CreateSessionDto,
    ): Promise<{ session: Stripe.Checkout.Session }> {
        await this.validateCampaign(sessionDto)

        const appUrl = this.config.get<string>('APP_URL')
        const mode = sessionDto.mode
        const metadata: DonationMetadata = {
            campaignId: sessionDto.campaignId,
        }

        const session = await this.stripeClient.checkout.sessions.create({
            mode,
            line_items: [{ price: sessionDto.priceId, quantity: 1 }],
            payment_method_types: ['card'],
            payment_intent_data: mode === 'payment' ? { metadata } : undefined,
            subscription_data: mode === 'subscription' ? { metadata } : undefined,
            success_url: sessionDto.successUrl ?? `${appUrl}/success`,
            cancel_url: sessionDto.cancelUrl ?? `${appUrl}/canceled`,
            tax_id_collection: {
                enabled: true,
            },
        })
        return { session }
    }

    async validateCampaign(sessionDto: CreateSessionDto) {
        const canAcceptDonation = await this.campaignServie.canAcceptDonations(sessionDto.campaignId)
        if (canAcceptDonation) {
            return true
        }

        throw new NotAcceptableException('This campaign cannot accept donations')
    }

    async listDonations(): Promise<Donation[]> {
        return await this.prisma.donation.findMany();
    }

    async getDonationById(id: string): Promise<Donation> {
        try {
            const donation = await this.prisma.donation.findFirst({
                where: {
                    id: id
                },
                rejectOnNotFound: true,
            })
            return donation
        } catch (err) {
            const msg = 'No Donation record with ID: ' + id
            Logger.warn(msg)
            throw new NotFoundException(msg)
        }
    }

    async create(inputDto: CreatePaymentDto): Promise<Donation> {
        let user: User = {
            given_name: "ok",
            family_name: "ok",
            email: "Nels57@yahoo.com",
        }
        let vault: Vault = {
            id: "073f8871-d14d-4cec-ad8b-1400896ff6ef",
            currency: "BGN",
            amount: 0,
            campaign: {}
        }
        return await this.prisma.donation.create({ data: inputDto.toEntity(user, vault) })
    }

    update(id: string, updatePaymentDto: UpdatePaymentDto) {

    }

    remove(ids: string[]) {

    }

}
