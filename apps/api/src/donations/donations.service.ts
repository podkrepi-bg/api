import { InjectStripeClient } from '@golevelup/nestjs-stripe'
import { Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Donation, DonationStatus, Prisma } from '@prisma/client'
import Stripe from 'stripe'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from '../vault/vault.service'
import { DonationMetadata } from './dontation-metadata.interface'
import { CreateBankPaymentDto } from './dto/create-bank-payment.dto'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'

@Injectable()
export class DonationsService {
  constructor(
    @InjectStripeClient() private stripeClient: Stripe,
    private config: ConfigService,
    private campaignServie: CampaignService,
    private prisma: PrismaService,
    private person: PersonService,
    private vaultService: VaultService,
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
    return await this.prisma.donation.findMany({ orderBy: [{ createdAt: 'desc' }] })
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

    if (donation.status === DonationStatus.succeeded) {
      await this.vaultService.incrementVaultAmount(donation.targetVaultId, donation.amount)
    }

    return donation
  }

  /**
   * Used by the administrators to manually add donations executed by bank payments to a campaign.
   */
  async createBankPayment(inputDto: CreateBankPaymentDto): Promise<Donation> {
    const donation = await this.prisma.donation.create({ data: inputDto.toEntity() })

    // Donation status check is not needed, because bank payments are only added by admins if the bank transfer was successful.
    await this.vaultService.incrementVaultAmount(donation.targetVaultId, donation.amount)

    return donation
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Donation> {
    try {
      const oldDonationStatus = (
        await this.prisma.donation.findFirst({
          where: { id },
          select: { status: true },
        })
      )?.status

      if (oldDonationStatus === DonationStatus.succeeded) {
        throw new Error('Succeded donations cannot be updated.')
      }

      const donation = await this.prisma.donation.update({
        where: { id },
        data: {
          status: updatePaymentDto.status,
        },
      })

      if (updatePaymentDto.status === DonationStatus.succeeded) {
        await this.vaultService.incrementVaultAmount(donation.targetVaultId, donation.amount)
      }

      return donation
    } catch (err) {
      const msg = `Update failed. No Donation found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async softDelete(ids: string[]): Promise<Prisma.BatchPayload> {
    try {
      return await this.prisma.donation.updateMany({
        where: { id: { in: ids } },
        data: {
          status: DonationStatus.deleted,
        },
      })
    } catch (err) {
      const msg = `Delete failed. No Donation found with given ID`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async getDonationsByUser(personSub: string) {
    const person = await this.person.findOneByKeycloakId(personSub)
    const donations = await this.prisma.donation.findMany({
      include: {
        targetVault: {
          include: { campaign: true },
        },
      },
      where: { personId: person?.id },
    })
    const total = donations.reduce((acc, current) => {
      acc += current.amount
      return acc
    }, 0)
    return { donations, total }
  }
}
