import {
  Campaign,
  CampaignState,
  CampaignType,
  Donation,
  DonationStatus,
  DonationType,
  PaymentProvider,
  Vault,
} from '.prisma/client'
import Stripe from 'stripe'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async listCampaigns(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      include: {
        summary: { select: { reachedAmount: true } },
      },
    })
  }

  async getCampaignById(campaignId: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId } })
    if (campaign === null) {
      Logger.warn('No campaign record with ID: ' + campaignId)
      throw new NotFoundException('No campaign record with ID: ' + campaignId)
    }
    return campaign
  }

  async getCampaignBySlug(slug: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findFirst({
      include: {
        summary: { select: { reachedAmount: true } },
      },
      where: { slug },
    })
    if (campaign === null) {
      Logger.warn('No campaign record with slug: ' + slug)
      throw new NotFoundException('No campaign record with slug: ' + slug)
    }
    return campaign
  }

  async listCampaignTypes(): Promise<CampaignType[]> {
    return this.prisma.campaignType.findMany()
  }

  async createCampaign(inputDto: CreateCampaignDto): Promise<Campaign> {
    return this.prisma.campaign.create({
      data: inputDto.toEntity(),
    })
  }

  async getCampaignVault(campaignId: string): Promise<Vault | null> {
    return this.prisma.vault.findFirst({ where: { campaignId } })
  }

  async donateToCampaign(
    campaign: Campaign,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<Donation> {
    const campaignId = campaign.id
    const { currency } = campaign
    const { amount, customer } = paymentIntent
    Logger.log('[ DonateToCampaign ]', { campaignId, customer, amount })

    /**
     * Create or connect campaign vault
     */
    const vault = await this.getCampaignVault(campaignId)
    const targetVault = vault
      ? // Connect the existing vault to this donation
        { connect: { id: vault.id } }
      : // Create new vault for the campaign
        { create: { campaignId, currency, amount } }

    /**
     * Create donation object
     */
    const donation = await this.prisma.donation.create({
      data: {
        amount,
        currency,
        targetVault,
        provider: PaymentProvider.stripe,
        type: DonationType.donation,
        status: DonationStatus.succeeded,
        extCustomerId: typeof customer === 'string' ? customer : customer?.id ?? 'none',
        extPaymentIntentId: paymentIntent.id,
        extPaymentMethodId:
          typeof paymentIntent.payment_method === 'string'
            ? paymentIntent.payment_method
            : paymentIntent.payment_method?.id ?? 'none',
      },
    })

    /**
     * Update vault amount
     * TODO: Replace with joined view
     */
    if (vault) {
      await this.prisma.vault.update({
        data: {
          amount: {
            increment: amount,
          },
        },
        where: { id: vault.id },
      })
    }

    return donation
  }

  async canAcceptDonations(campaignId: string): Promise<boolean> {
    const campaign = await this.getCampaignById(campaignId)

    const validStates: CampaignState[] = ['active']
    if (!validStates.includes(campaign.state)) {
      return false
    }

    return true
  }
}
