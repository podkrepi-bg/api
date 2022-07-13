import Stripe from 'stripe'
import { ConfigService } from '@nestjs/config'
import { InjectStripeClient } from '@golevelup/nestjs-stripe'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import {
  Campaign,
  Donation,
  DonationStatus,
  DonationType,
  PaymentProvider,
  Prisma,
} from '@prisma/client'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { CampaignService } from '../campaign/campaign.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from '../vault/vault.service'
import { DonationMetadata } from './dontation-metadata.interface'
import { CreateBankPaymentDto } from './dto/create-bank-payment.dto'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'
import { Person } from '../person/entities/person.entity'
import { CreateManyBankPaymentsDto } from './dto/create-many-bank-payments.dto'

@Injectable()
export class DonationsService {
  constructor(
    @InjectStripeClient() private stripeClient: Stripe,
    private config: ConfigService,
    private campaignService: CampaignService,
    private prisma: PrismaService,
    private vaultService: VaultService,
  ) {}

  async listPrices(type?: Stripe.PriceListParams.Type, active?: boolean): Promise<Stripe.Price[]> {
    const list = await this.stripeClient.prices.list({ active, type })
    return list.data
  }

  /**
   * Create initial donation object for tracking purposes
   */
  async createInitialDonation(
    campaign: Campaign,
    sessionDto: CreateSessionDto,
    paymentIntent: string,
  ): Promise<Donation> {
    const campaignId = campaign.id
    const { currency } = campaign
    const amount = sessionDto.amount
    Logger.log('[ CreateInitialDonation ]', { campaignId, amount })

    /**
     * Create or connect campaign vault
     */
    const vault = await this.prisma.vault.findFirst({ where: { campaignId } })
    const targetVaultData = vault
      ? // Connect the existing vault to this donation
        { connect: { id: vault.id } }
      : // Create new vault for the campaign
        { create: { campaignId, currency, amount, name: campaign.title } }
    /**
     * Create initial donation object
     */
    const donation = await this.prisma.donation.create({
      data: {
        amount,
        currency,
        provider: PaymentProvider.stripe,
        type: DonationType.donation,
        status: DonationStatus.initial,
        extCustomerId: sessionDto.personEmail ?? '',
        extPaymentIntentId: paymentIntent,
        extPaymentMethodId: '',
        targetVault: targetVaultData,
        person: {
          connectOrCreate: {
            where: {
              email: sessionDto.personEmail ?? 'anonymous@podkrepi.bg',
            },
            create: {
              firstName: sessionDto.firstName ?? 'Anonymous',
              lastName: sessionDto.lastName ?? 'Donor',
              email: sessionDto.personEmail ?? 'anonymous@podkrepi.bg',
              phone: sessionDto.phone,
            },
          },
        },
      },
    })

    return donation
  }

  async createCheckoutSession(
    sessionDto: CreateSessionDto,
  ): Promise<{ session: Stripe.Checkout.Session }> {
    const campaign = await this.campaignService.validateCampaignId(sessionDto.campaignId)
    const { mode } = sessionDto
    const appUrl = this.config.get<string>('APP_URL')
    const metadata: DonationMetadata = { campaignId: sessionDto.campaignId }

    const session = await this.stripeClient.checkout.sessions.create({
      mode,
      customer_email: sessionDto.personEmail,
      line_items: this.prepareSessionItems(sessionDto, campaign),
      payment_method_types: ['card'],
      payment_intent_data: mode === 'payment' ? { metadata } : undefined,
      subscription_data: mode === 'subscription' ? { metadata } : undefined,
      success_url: sessionDto.successUrl ?? `${appUrl}/success`,
      cancel_url: sessionDto.cancelUrl ?? `${appUrl}/canceled`,
      tax_id_collection: { enabled: true },
    })

    this.createInitialDonation(campaign, sessionDto, session.payment_intent as string)

    return { session }
  }

  private prepareSessionItems(
    sessionDto: CreateSessionDto,
    campaign: Campaign,
  ): Stripe.Checkout.SessionCreateParams.LineItem[] {
    // Use priceId if provided
    if (sessionDto.priceId) {
      return [
        {
          price: sessionDto.priceId,
          quantity: 1,
        },
      ]
    }
    // Create donation with custom amount
    return [
      {
        name: campaign.title,
        amount: sessionDto.amount,
        currency: campaign.currency,
        quantity: 1,
      },
    ]
  }

  /**
   * Lists all donations without confidential fields
   * @param campaignId (Optional) Filter by campaign id
   * @param status (Optional) Filter by campaign status
   */
  async listDonationsPublic(
    campaignId?: string,
    status?: DonationStatus,
  ): Promise<
    Omit<
      Donation,
      'personId' | 'targetVaultId' | 'extCustomerId' | 'extPaymentIntentId' | 'extPaymentMethodId'
    >[]
  > {
    return await this.prisma.donation.findMany({
      where: { status, targetVault: { campaign: { id: campaignId } } },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        type: true,
        status: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        amount: true,
        currency: true,
        person: { select: { firstName: true, lastName: true } },
      },
    })
  }

  /**
   * Lists all donations with all fields only for admin roles
   * @param campaignId (Optional) Filter by campaign id
   * @param status (Optional) Filter by campaign status
   */
  async listDonations(campaignId?: string, status?: DonationStatus): Promise<Donation[]> {
    return await this.prisma.donation.findMany({
      where: { status, targetVault: { campaign: { id: campaignId } } },
      orderBy: [{ createdAt: 'desc' }],
    })
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

  async getUserDonationById(
    id: string,
    keycloakId: string,
  ): Promise<(Donation & { person: Person | null }) | null> {
    return await this.prisma.donation.findFirst({
      where: { id, person: { keycloakId }, status: DonationStatus.succeeded },
      include: { person: true },
    })
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
  async createManyBankPayments(
    DonationsDto: CreateManyBankPaymentsDto[],
  ): Promise<Prisma.BatchPayload> {
    try {
      const donations = await this.prisma.donation.createMany({ data: DonationsDto })

      // Donation status check is not needed, because bank payments are only added by admins if the bank transfer was successful.
      //TODO functionality for updating multiple donations
      const updateManyVaults = Promise.all(
        DonationsDto.map((donation) => {
          this.vaultService.incrementVaultAmount(donation.targetVaultId, donation.amount)
        }),
      )
      return donations
    } catch (error) {
      Logger.warn(error)
      throw new BadRequestException(error)
    }
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

  async getDonationsByUser(keycloakId: string) {
    const donations = await this.prisma.donation.findMany({
      include: {
        targetVault: {
          include: { campaign: { select: { title: true } } },
        },
      },
      where: { person: { keycloakId } },
    })

    const total = donations.reduce((acc, current) => {
      acc += current.amount
      return acc
    }, 0)

    return { donations, total }
  }
}
