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
import { Response } from 'express'
import { getTemplateByTable } from '../export/helpers/exportableData'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { CampaignService } from '../campaign/campaign.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from '../vault/vault.service'
import { ExportService } from '../export/export.service'
import { DonationMetadata } from './dontation-metadata.interface'
import { CreateBankPaymentDto } from './dto/create-bank-payment.dto'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'
import { Person } from '../person/entities/person.entity'
import { CreateManyBankPaymentsDto } from './dto/create-many-bank-payments.dto'
import { DonationBaseDto, ListDonationsDto } from './dto/list-donations.dto'
import { donationWithPerson, DonationWithPerson } from './validators/donation.validator'

@Injectable()
export class DonationsService {
  constructor(
    @InjectStripeClient() private stripeClient: Stripe,
    private config: ConfigService,
    private campaignService: CampaignService,
    private prisma: PrismaService,
    private vaultService: VaultService,
    private exportService: ExportService,
  ) {}

  async listPrices(type?: Stripe.PriceListParams.Type, active?: boolean): Promise<Stripe.Price[]> {
    const list = await this.stripeClient.prices.list({ active, type, limit: 100 })
    return list.data.filter((price) => price.active)
  }

  /**
   * Create initial donation object for tracking purposes
   */
  async createInitialDonation(
    campaign: Campaign,
    sessionDto: CreateSessionDto,
    paymentIntentId: string,
  ): Promise<Donation> {
    Logger.log('[ CreateInitialDonation ]', {
      campaignId: campaign.id,
      amount: sessionDto.amount,
      paymentIntentId,
    })

    /**
     * Create or connect campaign vault
     */
    const vault = await this.prisma.vault.findFirst({ where: { campaignId: campaign.id } })
    const targetVaultData = vault
      ? // Connect the existing vault to this donation
        { connect: { id: vault.id } }
      : // Create new vault for the campaign
        { create: { campaignId: campaign.id, currency: campaign.currency, name: campaign.title } }
    /**
     * Create initial donation object
     */
    const donation = await this.prisma.donation.create({
      data: {
        amount: 0, //this will be updated on successful payment event
        chargedAmount: sessionDto.amount,
        currency: campaign.currency,
        provider: PaymentProvider.stripe,
        type: DonationType.donation,
        status: DonationStatus.initial,
        extCustomerId: sessionDto.personEmail ?? '',
        extPaymentIntentId: paymentIntentId,
        extPaymentMethodId: sessionDto.mode === 'subscription' ? 'subscription' : 'card',
        billingEmail: sessionDto.isAnonymous ? sessionDto.personEmail : null, //set the personal mail to billing which is not public field
        targetVault: targetVaultData,
      },
    })

    if (!sessionDto.isAnonymous) {
      await this.prisma.donation.update({
        where: { id: donation.id },
        data: {
          person: {
            connectOrCreate: {
              where: {
                email: sessionDto.personEmail,
              },
              create: {
                firstName: sessionDto.firstName ?? '',
                lastName: sessionDto.lastName ?? '',
                email: sessionDto.personEmail,
                phone: sessionDto.phone,
              },
            },
          },
        },
      })
    }

    if (sessionDto.message) {
      await this.createDonationWish(sessionDto.message, donation.id, campaign.id)
    }

    return donation
  }

  async createCheckoutSession(
    sessionDto: CreateSessionDto,
  ): Promise<{ session: Stripe.Checkout.Session }> {
    const campaign = await this.campaignService.validateCampaignId(sessionDto.campaignId)
    const { mode } = sessionDto
    const appUrl = this.config.get<string>('APP_URL')
    const metadata: DonationMetadata = {
      campaignId: sessionDto.campaignId,
      personId: sessionDto.personId,
    }

    const items = await this.prepareSessionItems(sessionDto, campaign)

    const createSessionRequest: Stripe.Checkout.SessionCreateParams = {
      mode,
      customer_email: sessionDto.personEmail,
      line_items: items,
      payment_method_types: ['card'],
      payment_intent_data: mode == 'payment' ? { metadata } : undefined,
      subscription_data: mode == 'subscription' ? { metadata } : undefined,
      success_url: sessionDto.successUrl ?? `${appUrl}/success`,
      cancel_url: sessionDto.cancelUrl ?? `${appUrl}/canceled`,
      tax_id_collection: { enabled: true },
    }

    Logger.debug('[ CreateCheckoutSession ]', createSessionRequest)

    const session = await this.stripeClient.checkout.sessions.create(createSessionRequest)

    Logger.log('[ CreateInitialDonation ]', {
      session: session,
    })

    await this.createInitialDonation(
      campaign,
      sessionDto,
      (session.payment_intent as string) ?? session.id,
    )

    return { session }
  }

  private async prepareSessionItems(
    sessionDto: CreateSessionDto,
    campaign: Campaign,
  ): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> {
    if (sessionDto.mode == 'subscription') {
      //use an inline price for subscriptions
      const stripeItem = {
        price_data: {
          currency: campaign.currency,
          unit_amount: sessionDto.amount,
          recurring: {
            interval: 'month' as Stripe.Price.Recurring.Interval,
            interval_count: 1,
          },
          product_data: {
            name: campaign.title,
          },
        },
        quantity: 1,
      }
      return [stripeItem]
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
   * @param pageIndex (Optional)
   * @param pageSize (Optional)
   * @param type (Optional) Filter by type
   */
  async listDonationsPublic(
    campaignId?: string,
    status?: DonationStatus,
    pageIndex?: number,
    pageSize?: number,
  ): Promise<ListDonationsDto<DonationBaseDto>> {
    const data = await this.prisma.donation.findMany({
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
        chargedAmount: true,
        currency: true,
        person: { select: { firstName: true, lastName: true } },
      },
      skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
      take: pageSize ? pageSize : undefined,
    })

    const count = await this.prisma.donation.count({
      where: { status, targetVault: { campaign: { id: campaignId } } },
    })

    const result = {
      items: data,
      total: count,
    }
    return result
  }

  /**
   * Lists all donations with all fields only for admin roles
   * @param campaignId (Optional) Filter by campaign id
   * @param status (Optional) Filter by campaign status
   * @param type (Optional) Filter by donation type
   * @param from (Optional) Filter by creation date
   * @param to (Optional) Filter by creation date
   * @param search (Optional) Search by name or email
   * @param pageIndex (Optional)
   * @param pageSize (Optional)
   */
  async listDonations(
    campaignId?: string,
    status?: DonationStatus,
    type?: DonationType,
    from?: Date,
    to?: Date,
    search?: string,
    pageIndex?: number,
    pageSize?: number,
  ): Promise<ListDonationsDto<DonationWithPerson>> {
    const data = await this.prisma.donation.findMany({
      where: {
        status,
        type,
        createdAt: {
          gte: from,
          lte: to,
        },
        ...(search && {
          OR: [
            { billingName: { contains: search } },
            { billingEmail: { contains: search } },
            {
              person: {
                OR: [
                  {
                    firstName: { contains: search },
                  },
                  {
                    lastName: { contains: search },
                  },
                ],
              },
            },
          ],
        }),
        targetVault: { campaign: { id: campaignId } },
      },
      skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
      take: pageSize ? pageSize : undefined,
      ...donationWithPerson,
    })

    const count = await this.prisma.donation.count({
      where: {
        status,
        type,
        createdAt: {
          gte: from,
          lte: to,
        },
        ...(search && {
          OR: [
            { billingName: { contains: search } },
            { billingEmail: { contains: search } },
            {
              person: {
                OR: [
                  {
                    firstName: { contains: search },
                  },
                  {
                    lastName: { contains: search },
                  },
                ],
              },
            },
          ],
        }),
        targetVault: { campaign: { id: campaignId } },
      },
    })

    const result = {
      items: data,
      total: count,
    }
    return result
  }

  /**
   *  Get donation by id
   * @param id Donation id
   * @returns  {Promise<Donation>} Donation
   * @throws NotFoundException if no donation is found
   */
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

  /**
   * Get donation by id with person data attached
   * @param id Donation id
   * @param keycloakId Keycloak id of the user
   * @returns {Promise<Donation & { person: Person | null }>} Donation
   */
  async getUserDonationById(
    id: string,
    keycloakId: string,
  ): Promise<(Donation & { person: Person | null }) | null> {
    return await this.prisma.donation.findFirst({
      where: { id, person: { keycloakId }, status: DonationStatus.succeeded },
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        targetVault: {
          select: {
            id: true,
            campaign: {
              select: {
                id: true,
                slug: true,
                title: true,
              },
            },
          },
        },
      },
    })
  }

  /** Describe the function below
   * @param inputDto
   * @param user
   * @returns {Promise<Donation>}
   *
   */
  async create(inputDto: CreatePaymentDto, user: KeycloakTokenParsed): Promise<Donation> {
    const donation = await this.prisma.donation.create({ data: inputDto.toEntity(user) })

    if (donation.status === DonationStatus.succeeded) {
      await this.vaultService.incrementVaultAmount(donation.targetVaultId, donation.amount)
    }

    return donation
  }

  /**
   * Create a payment intent for a donation
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async createPaymentIntent(
    inputDto: Stripe.PaymentIntentCreateParams,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return this.stripeClient.paymentIntents.create(inputDto)
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

  async createManyBankPayments(donationsDto: CreateManyBankPaymentsDto[]) {
    for (const donation of donationsDto) {
      try {
        //upserting so that if we import the same file again with additional fields the records to be updated accordingly
        await this.prisma.donation.upsert({
          where: { extPaymentIntentId: donation.extPaymentIntentId },
          update: donation,
          create: donation,
        })

        //now update the Vault amounts too
        this.vaultService.incrementVaultAmount(donation.targetVaultId, donation.amount)
      } catch (error) {
        Logger.error('Error while importing bank donation. ', error)
      }
    }
  }

  /**
   * Updates the donation's status or donor. Note: completed donations cannot have status updates.
   * @param id
   * @param updatePaymentDto
   * @returns
   */
  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Donation> {
    try {
      const currentDonation = await this.prisma.donation.findFirst({
        where: { id },
      })
      if (!currentDonation) {
        throw new NotFoundException(`Update failed. No donation found with ID: ${id}`)
      }

      if (
        currentDonation.status === DonationStatus.succeeded &&
        updatePaymentDto.status &&
        updatePaymentDto.status !== DonationStatus.succeeded
      ) {
        throw new BadRequestException('Succeeded donations cannot be updated.')
      }

      const status = updatePaymentDto.status || currentDonation.status
      let donorId = currentDonation.personId
      if (
        updatePaymentDto.targetPersonId &&
        currentDonation.personId !== updatePaymentDto.targetPersonId
      ) {
        const targetDonor = await this.prisma.person.findFirst({
          where: { id: updatePaymentDto.targetPersonId },
        })
        if (!targetDonor) {
          throw new NotFoundException(
            `Update failed. No person found with ID: ${updatePaymentDto.targetPersonId}`,
          )
        }
        donorId = targetDonor.id
      }

      const donation = await this.prisma.donation.update({
        where: { id },
        data: {
          status: status,
          personId: donorId,
        },
      })

      if (
        currentDonation.status !== DonationStatus.succeeded &&
        updatePaymentDto.status === DonationStatus.succeeded &&
        donation.status === DonationStatus.succeeded
      ) {
        await this.vaultService.incrementVaultAmount(
          currentDonation.targetVaultId,
          currentDonation.amount,
        )
      }

      return donation
    } catch (err) {
      Logger.warn(err.message || err)
      throw err
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
      where: { person: { keycloakId } },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        targetVault: {
          include: { campaign: { select: { title: true, slug: true } } },
        },
      },
    })

    const total = donations.reduce((acc, current) => {
      if (current.status === DonationStatus.succeeded) {
        acc += current.amount
      }
      return acc
    }, 0)
    return { donations, total }
  }

  async createDonationWish(message: string, donationId: string, campaignId: string) {
    const person = await this.prisma.donation.findUnique({ where: { id: donationId } }).person()
    await this.prisma.donationWish.create({
      data: {
        message: message,
        donationId,
        campaignId,
        personId: person?.id,
      },
    })
  }

  async getUserId(email: string): Promise<string | null> {
    const user = await this.prisma.person.findFirst({
      where: { email },
      select: { id: true },
    })

    if (!user) {
      return null
    }

    return user.id
  }

  /**
   *  @param res  - Response object to be used for the export to excel file
   */
  async exportToExcel(res: Response) {
    const { items } = await this.listDonations()
    const donationsMappedForExport = items.map((donation) => ({
      ...donation,
      amount: donation.amount / 100,
      person: donation.person
        ? `${donation.person.firstName} ${donation.person.lastName}`
        : 'Unknown',
    }))
    const donationExcelTemplate = getTemplateByTable('donations')

    await this.exportService.exportToExcel(res, donationsMappedForExport, donationExcelTemplate)
  }
}
