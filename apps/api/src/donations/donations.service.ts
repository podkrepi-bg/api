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
import { DonationBaseDto, ListDonationsDto } from './dto/list-donations.dto'
import { donationWithPerson, DonationWithPerson } from './queries/donation.validator'
import { CreateStripePaymentDto } from './dto/create-stripe-payment.dto'
import { ImportStatus } from '../bank-transactions-file/dto/bank-transactions-import-status.dto'
import { DonationQueryDto } from '../common/dto/donation-query-dto'
import { HotCache } from '../common/hotcache'

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

  private cache = new HotCache(this.config.get<number>('hotcache.ttl') || 0, !!this.config.get<boolean>('hotcache.enabled'))

  async listPrices(type?: Stripe.PriceListParams.Type, active?: boolean): Promise<Stripe.Price[]> {
    const listResponse = await this.stripeClient.prices.list({ active, type, limit: 100 }).then(
      function (list) {
        Logger.debug('[Stripe] Prices received: ' + list.data.length)
        return { list }
      },
      function (error) {
        if (error instanceof Stripe.errors.StripeError)
          Logger.error(
            '[Stripe] Error while getting price list. Error type: ' +
              error.type +
              ' message: ' +
              error.message +
              ' full error: ' +
              JSON.stringify(error),
          )
      },
    )

    if (listResponse) {
      return listResponse.list.data.filter((price) => price.active)
    } else return new Array<Stripe.Price>()
  }

  /**
   * Create initial donation object for tracking purposes
   */
  async createInitialDonationFromSession(
    campaign: Campaign,
    sessionDto: CreateSessionDto,
    paymentIntentId: string,
  ) {
    Logger.log('[ CreateInitialDonation ]', {
      campaignId: campaign.id,
      amount: sessionDto.amount,
      paymentIntentId,
    })

    // /**
    //  * Create or connect campaign vault
    //  */
    // const vault = await this.prisma.vault.findFirst({ where: { campaignId: campaign.id } })
    // const targetVaultData = vault
    //   ? // Connect the existing vault to this donation
    //     { connect: { id: vault.id } }
    //   : // Create new vault for the campaign
    //     { create: { campaignId: campaign.id, currency: campaign.currency, name: campaign.title } }

    /**
     * Here we cannot create initial donation anymore because stripe is not returning paymentIntendId in the CreateSessionDto
     * It will be created in the paymentIntent.created webhook
     */
  }

  /**
   * Create initial donation object for tracking purposes
   * This is used when the payment is created from the payment intent
   */
  async createInitialDonationFromIntent(
    campaign: Campaign,
    stripePaymentDto: CreateStripePaymentDto,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<Donation> {
    Logger.debug('[ CreateInitialDonationFromIntent]', {
      campaignId: campaign.id,
      amount: paymentIntent.amount,
      paymentIntentId: paymentIntent.id,
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
     * Create or update initial donation object
     */
    const donation = await this.prisma.donation.upsert({
      where: { extPaymentIntentId: paymentIntent.id },
      create: {
        amount: 0,
        chargedAmount: paymentIntent.amount,
        currency: campaign.currency,
        provider: PaymentProvider.stripe,
        type: DonationType.donation,
        status: DonationStatus.initial,
        extCustomerId: stripePaymentDto.personEmail,
        extPaymentIntentId: paymentIntent.id,
        extPaymentMethodId: 'card',
        billingEmail: stripePaymentDto.personEmail,
        targetVault: targetVaultData,
      },
      update: {
        amount: 0, //this will be updated on successful payment event
        chargedAmount: paymentIntent.amount,
        currency: campaign.currency,
        provider: PaymentProvider.stripe,
        type: DonationType.donation,
        status: DonationStatus.waiting,
        extCustomerId: stripePaymentDto.personEmail,
        extPaymentMethodId: 'card',
        billingEmail: stripePaymentDto.personEmail,
        targetVault: targetVaultData,
      },
    })

    if (!stripePaymentDto.isAnonymous) {
      await this.prisma.donation.update({
        where: { id: donation.id },
        data: {
          person: {
            connectOrCreate: {
              where: {
                email: stripePaymentDto.personEmail,
              },
              create: {
                firstName: stripePaymentDto.firstName ?? '',
                lastName: stripePaymentDto.lastName ?? '',
                email: stripePaymentDto.personEmail,
                phone: stripePaymentDto.phone,
              },
            },
          },
        },
      })
    }

    return donation
  }

  async createCheckoutSession(
    sessionDto: CreateSessionDto,
  ): Promise<void | { session: Stripe.Checkout.Session }> {
    const campaign = await this.campaignService.validateCampaignId(sessionDto.campaignId)
    const { mode } = sessionDto
    const appUrl = this.config.get<string>('APP_URL')
    const metadata: DonationMetadata = {
      campaignId: sessionDto.campaignId,
      personId: sessionDto.personId,
      isAnonymous: sessionDto.isAnonymous ? 'true' : 'false',
      wish: sessionDto.message ?? null,
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

    const sessionResponse = await this.stripeClient.checkout.sessions
      .create(createSessionRequest)
      .then(
        function (session) {
          Logger.debug('[Stripe] Checkout session created.')
          return { session }
        },
        function (error) {
          if (error instanceof Stripe.errors.StripeError)
            Logger.error(
              '[Stripe] Error while creating checkout session. Error type: ' +
                error.type +
                ' message: ' +
                error.message +
                ' full error: ' +
                JSON.stringify(error),
            )
        },
      )

    if (sessionResponse) {
      this.createInitialDonationFromSession(
        campaign,
        sessionDto,
        (sessionResponse.session.payment_intent as string) ?? sessionResponse.session.id,
      )
    }

    return sessionResponse
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
        price_data: {
          currency: campaign.currency,
          unit_amount: sessionDto.amount,
          product_data: {
            name: campaign.title,
          },
        },
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
    const cacheKey = `donations-${campaignId}-${status}-${pageIndex}-${pageSize}`
    const cachedDonations = this.cache.get(cacheKey)
    if (cachedDonations) {
      return cachedDonations
    }

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

    this.cache.set(cacheKey, result)

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
    provider?: PaymentProvider,
    minAmount?: number,
    maxAmount?: number,
    from?: Date,
    to?: Date,
    search?: string,
    sortBy?: string,
    pageIndex?: number,
    pageSize?: number,
  ): Promise<ListDonationsDto<DonationWithPerson>> {
    const whereClause = {
      status,
      provider,
      amount: {
        gte: minAmount,
        lte: maxAmount,
      },
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
    }

    const data = await this.prisma.donation.findMany({
      where: whereClause,
      orderBy: [sortBy ? { [sortBy]: 'desc' } : { createdAt: 'desc' }],
      skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
      take: pageSize ? pageSize : undefined,
      ...donationWithPerson,
    })

    const count = await this.prisma.donation.count({
      where: whereClause,
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
    email: string,
  ): Promise<(Donation & { person: Person | null }) | null> {
    return await this.prisma.donation.findFirst({
      where: {
        id,
        status: DonationStatus.succeeded,
        OR: [{ billingEmail: email }, { person: { keycloakId } }],
      },
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
    return await this.stripeClient.paymentIntents.create(inputDto)
  }

  /**
   * Create a payment intent for a donation
   * https://stripe.com/docs/api/payment_intents/create
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async createStripePayment(inputDto: CreateStripePaymentDto): Promise<Donation> {
    const intent = await this.stripeClient.paymentIntents.retrieve(inputDto.paymentIntentId)
    if (!intent.metadata.campaignId) {
      throw new BadRequestException('Campaign id is missing from payment intent metadata')
    }
    const campaignId = intent.metadata.camapaignId
    const campaign = await this.campaignService.validateCampaignId(campaignId)
    return this.createInitialDonationFromIntent(campaign, inputDto, intent)
  }

  /**
   * Update a payment intent for a donation
   * https://stripe.com/docs/api/payment_intents/update
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async updatePaymentIntent(
    id: string,
    inputDto: Stripe.PaymentIntentUpdateParams,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return this.stripeClient.paymentIntents.update(id, inputDto)
  }

  /**
   * Cancel a payment intent for a donation
   * https://stripe.com/docs/api/payment_intents/cancel
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async cancelPaymentIntent(
    id: string,
    inputDto: Stripe.PaymentIntentCancelParams,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return this.stripeClient.paymentIntents.cancel(id, inputDto)
  }

  async createUpdateBankPayment(donationDto: CreateBankPaymentDto): Promise<ImportStatus> {
    return await this.prisma.$transaction(async (tx) => {
      //to avoid incrementing vault amount twice we first check if there is such donation
      const existingDonation = await tx.donation.findUnique({
        where: { extPaymentIntentId: donationDto.extPaymentIntentId },
      })

      if (!existingDonation) {
        await tx.donation.create({
          data: donationDto,
        })

        await this.vaultService.incrementVaultAmount(
          donationDto.targetVaultId,
          donationDto.amount,
          tx,
        )
        return ImportStatus.SUCCESS
      }

      //Donation exists, so updating with incoming donation without increasing vault amounts
      await this.prisma.donation.update({
        where: { extPaymentIntentId: donationDto.extPaymentIntentId },
        data: donationDto,
      })
      return ImportStatus.UPDATED
    })
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

  async getDonationsByUser(keycloakId: string, email: string) {
    const donations = await this.prisma.donation.findMany({
      where: {
        OR: [{ billingEmail: email }, { person: { keycloakId } }],
      },
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

  async getTotalDonatedMoney() {
    const cachedAmount = this.cache.get('totalDonatedMoney')
    if (cachedAmount) {
        return { total: cachedAmount }
    }

    const totalMoney = await this.prisma.donation.aggregate({
      _sum: {
        amount: true,
      },
      where: { status: DonationStatus.succeeded },
    })

    // cache the amount for 30 seconds
    this.cache.set('totalDonatedMoney', totalMoney._sum.amount)

    return { total: totalMoney._sum.amount }
  }

  async getDonorsCount() {
    const cachedCount = this.cache.get('donorsCount')
    if (cachedCount) {
        return { count: cachedCount }
    }

    const donorsCount = await this.prisma.donation.groupBy({
      by: ['billingName'],
      where: { status: DonationStatus.succeeded },
      _count: {
        _all: true,
      },
      orderBy: { billingName: { sort: 'asc', nulls: 'first' } },
    })

    // get count of the donations with billingName == null
    const anonymousDonations = donorsCount[0]._count._all

    const totalCount = donorsCount.length - 1 + anonymousDonations

    // cache the count for 30 seconds
    this.cache.set('donorsCount', totalCount)

    // substract one because we don't want to include anonymousDonation again
    return { count: totalCount }
  }

  /**
   *  @param response  - Response object to be used for the export to excel file
   */
  async exportToExcel(query: DonationQueryDto, response: Response) {
    //get donations from db based on the filter parameters
    const { items } = await this.listDonations(
      query?.campaignId,
      query?.status,
      query?.provider,
      query?.minAmount,
      query?.maxAmount,
      query?.from,
      query?.to,
      query?.search,
      query?.sortBy,
    )

    const donationsMappedForExport = items.map((donation) => ({
      ...donation,
      amount: donation.amount / 100,
      person: donation.person
        ? `${donation.person.firstName} ${donation.person.lastName}`
        : 'Anonymous Donor',
      email: donation.person ? donation.person.email : '',
      campaignId: donation.targetVault.campaign.id,
    }))

    const donationExcelTemplate = getTemplateByTable('donations')

    await this.exportService.exportToExcel(
      response,
      donationsMappedForExport,
      donationExcelTemplate,
    )
  }
}
