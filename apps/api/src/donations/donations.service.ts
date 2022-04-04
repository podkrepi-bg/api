import { InjectStripeClient } from '@golevelup/nestjs-stripe'
import { Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CampaignState, Donation, DonationStatus } from '@prisma/client'
import Stripe from 'stripe'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { CampaignService } from '../campaign/campaign.service'
import { PrismaService } from '../prisma/prisma.service'
import { DonationMetadata } from './dontation-metadata.interface'
import { CreateBankPaymentDto } from './dto/create-bank-payment.dto'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'

type DeleteManyResponse = {
  count: number
}

@Injectable()
export class DonationsService {
  constructor(
    @InjectStripeClient() private stripeClient: Stripe,
    private config: ConfigService,
    private campaignServie: CampaignService,
    private prisma: PrismaService,
  ) {}

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
    return await this.prisma.donation.findMany()
  }

  async getDonationById(id: string): Promise<Donation> {
    try {
      const donation = await this.prisma.donation.findFirst({
        where: { id },
        rejectOnNotFound: true,
      })
      return donation
    } catch (err) {
      const msg = 'No Donation record with ID: ' + id
      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async create(inputDto: CreatePaymentDto, user: KeycloakTokenParsed): Promise<Donation> {
    const donation = await this.prisma.donation.create({ data: inputDto.toEntity(user) })

    if (donation.status === DonationStatus.succeeded)
      this.updateCampaignStatusIfTargetReached(donation)

    return donation
  }

  async createBankPayment(inputDto: CreateBankPaymentDto): Promise<Donation> {
    const donation = await this.prisma.donation.create({ data: inputDto.toEntity() })

    if (donation.status === DonationStatus.succeeded)
      this.updateCampaignStatusIfTargetReached(donation)

    return donation
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Donation> {
    try {
      const donation = await this.prisma.donation.update({
        where: { id },
        data: {
          status: updatePaymentDto.status,
        },
      })

      if (updatePaymentDto.status === 'succeeded') {
        this.updateCampaignStatusIfTargetReached(donation)
      }

      return donation
    } catch (err) {
      const msg = `Update failed. No Donation found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async remove(ids: string[]): Promise<DeleteManyResponse> {
    try {
      return await this.prisma.donation.deleteMany({
        where: { id: { in: ids } },
      })
    } catch (err) {
      const msg = `Delete failed. No Donation found with given ID`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async getDonationsByUser(personId: string) {
    const donations = await this.prisma.donation.findMany({
      include: {
        targetVault: {
          include: { campaign: true },
        },
      },
      where: { personId },
    })
    const total = donations.reduce((acc, current) => {
      acc += current.amount
      return acc
    }, 0)
    return { donations, total }
  }

  /**
   * Call after adding a successful donation to a vault.
   * This will set the campaign state to 'complete' if the campaign's target amount has been reached
   */
  private async updateCampaignStatusIfTargetReached(donation: Donation) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        vaults: {
          some: {
            id: donation.targetVaultId,
          },
        },
      },
      select: {
        vaults: true,
        targetAmount: true,
        id: true,
      },
    })

    if (campaign && campaign.targetAmount) {
      const totalAmount = campaign.vaults.map((vault) => vault.amount).reduce((a, b) => a + b, 0)

      if (totalAmount >= campaign.targetAmount) {
        await this.prisma.campaign.update({
          where: {
            id: campaign.id,
          },
          data: {
            state: CampaignState.complete,
          },
        })
      }
    }
  }
}
