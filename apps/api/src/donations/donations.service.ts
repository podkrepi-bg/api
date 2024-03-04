import Stripe from 'stripe'
import { ConfigService } from '@nestjs/config'
import { InjectStripeClient } from '@golevelup/nestjs-stripe'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import {
  Campaign,
  PaymentStatus,
  DonationType,
  PaymentProvider,
  Prisma,
  PaymentType,
  Payment,
  Donation,
} from '@prisma/client'
import { Response } from 'express'
import { getTemplateByTable } from '../export/helpers/exportableData'

import { CampaignService } from '../campaign/campaign.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from '../vault/vault.service'
import { ExportService } from '../export/export.service'
import { DonationMetadata } from './dontation-metadata.interface'
import { CreateBankPaymentDto } from './dto/create-bank-payment.dto'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'

import { DonationBaseDto, ListDonationsDto } from './dto/list-donations.dto'
import { donationWithPerson } from './queries/donation.validator'
import { CreateStripePaymentDto } from './dto/create-stripe-payment.dto'
import { ImportStatus } from '../bank-transactions-file/dto/bank-transactions-import-status.dto'
import { DonationQueryDto } from '../common/dto/donation-query-dto'
import { CreateAffiliateDonationDto } from '../affiliate/dto/create-affiliate-donation.dto'
import { VaultUpdate } from '../vault/types/vault'
import { PaymentWithDonation } from './types/donation'
import type { DonationWithPersonAndVault, PaymentWithDonationCount } from './types/donation'

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
  ): Promise<Payment> {
    Logger.debug('[ CreateInitialDonationFromIntent]', {
      campaignId: campaign.id,
      amount: paymentIntent.amount,
      paymentIntentId: paymentIntent.id,
    })

    const vault = await this.campaignService.getCampaignVault(campaign.id)
    const targetVaultData = { connect: { id: vault.id } }

    /**
     * Create or update initial donation object
     */
    const donation = await this.prisma.payment.upsert({
      where: { extPaymentIntentId: paymentIntent.id },
      create: {
        amount: 0,
        chargedAmount: paymentIntent.amount,
        currency: campaign.currency,
        type: PaymentType.single,
        provider: PaymentProvider.stripe,
        status: PaymentStatus.initial,
        extCustomerId: stripePaymentDto.personEmail,
        extPaymentIntentId: paymentIntent.id,
        extPaymentMethodId: 'card',
        billingEmail: stripePaymentDto.personEmail,
        donations: {
          create: {
            type: DonationType.donation,
            targetVault: targetVaultData,
          },
        },
      },
      update: {
        amount: 0, //this will be updated on successful payment event
        chargedAmount: paymentIntent.amount,
        currency: campaign.currency,
        provider: PaymentProvider.stripe,
        type: PaymentType.single,
        status: PaymentStatus.waiting,
        extCustomerId: stripePaymentDto.personEmail,
        extPaymentMethodId: 'card',
        billingEmail: stripePaymentDto.personEmail,
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
      type: sessionDto.type,
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
      // the membership campaign is internal only
      // we need to make the subscriptions once a year
      const isMembership = await this.campaignService.isMembershipCampaign(campaign.campaignTypeId)
      const interval = isMembership ? 'year' : 'month'

      //use an inline price for subscriptions
      const stripeItem = {
        price_data: {
          currency: campaign.currency,
          unit_amount: sessionDto.amount,
          recurring: {
            interval: interval as Stripe.Price.Recurring.Interval,
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
    status?: PaymentStatus,
    pageIndex?: number,
    pageSize?: number,
  ) {
    const [data, count] = await this.prisma.$transaction([
      this.prisma.donation.findMany({
        where: {
          OR: [{ payment: { status: status } }, { payment: { status: PaymentStatus.guaranteed } }],
          targetVault: { campaignId },
        },
        orderBy: [{ updatedAt: 'desc' }],
        select: {
          id: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          amount: true,
          person: {
            select: { firstName: true, lastName: true, company: { select: { companyName: true } } },
          },
        },

        skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
        take: pageSize ? pageSize : undefined,
      }),
      this.prisma.donation.count({
        where: {
          OR: [{ payment: { status: status } }, { payment: { status: PaymentStatus.guaranteed } }],
          targetVault: { campaignId },
        },
      }),
    ])

    const result = {
      items: data,
      total: count,
    }

    return result
  }

  async createAffiliateDonation(donationDto: CreateAffiliateDonationDto) {
    const vault = await this.vaultService.findByCampaignId(donationDto.campaignId)

    if (!vault || vault.length === 0) throw new NotFoundException('Campaign or vault not found')

    const payment = await this.prisma.payment.create({
      data: donationDto.toEntity(vault[0].id),
      include: { donations: true },
    })
    if (donationDto.metadata) {
      await this.prisma.donationMetadata.create({
        data: {
          donationId: payment.donations[0].id,
          ...donationDto.metadata,
        },
      })
    }
    if (donationDto.message) {
      await this.prisma.donationWish.create({
        data: {
          campaignId: donationDto.campaignId,
          message: donationDto.message,
          donationId: payment.donations[0].id,
          personId: donationDto.personId,
        },
      })
    }
    return payment
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
    paymentId?: string,
    campaignId?: string,
    paymentStatus?: PaymentStatus,
    paymentProvider?: PaymentProvider,
    minAmount?: number,
    maxAmount?: number,
    from?: Date,
    to?: Date,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    pageIndex?: number,
    pageSize?: number,
  ): Promise<ListDonationsDto<DonationWithPersonAndVault>> {
    const whereClause = Prisma.validator<Prisma.DonationWhereInput>()({
      amount: {
        gte: minAmount,
        lte: maxAmount,
      },
      createdAt: {
        gte: from,
        lte: to,
      },
      paymentId: paymentId,
      OR: [
        { payment: { status: paymentStatus } },
        { payment: { provider: paymentProvider } },
        { payment: { billingEmail: { contains: search } } },
        { payment: { billingName: { contains: search } } },
      ],
      targetVault: { campaign: { id: campaignId } },
    })

    const [data, count] = await this.prisma.$transaction([
      this.prisma.donation.findMany({
        where: whereClause,
        orderBy: [sortBy ? { [sortBy]: sortOrder ? sortOrder : 'desc' } : { createdAt: 'desc' }],
        skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
        take: pageSize ? pageSize : undefined,
        ...donationWithPerson,
      }),
      this.prisma.donation.count({
        where: whereClause,
      }),
    ])

    const result = {
      items: data,
      total: count,
    }

    return result
  }

  async listPayments(
    paymentId?: string,
    campaignId?: string,
    paymentStatus?: PaymentStatus,
    paymentProvider?: PaymentProvider,
    minAmount?: number,
    maxAmount?: number,
    from?: Date,
    to?: Date,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    pageIndex?: number,
    pageSize?: number,
  ): Promise<ListDonationsDto<PaymentWithDonationCount>> {
    const whereClause = Prisma.validator<Prisma.PaymentWhereInput>()({
      // id: paymentId,
      amount: {
        gte: minAmount,
        lte: maxAmount,
      },
      createdAt: {
        gte: from,
        lte: to,
      },
      status: paymentStatus,
      provider: paymentProvider,
      ...(search && {
        OR: [
          {
            billingEmail: { contains: search },
          },
          { billingName: { contains: search } },
        ],
      }),
      donations: { some: { targetVault: { campaignId } } },
    })
    const [data, count] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: whereClause,
        orderBy: [sortBy ? { [sortBy]: sortOrder ? sortOrder : 'desc' } : { createdAt: 'desc' }],
        skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
        take: pageSize ? pageSize : undefined,
        include: {
          _count: {
            select: {
              donations: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where: whereClause }),
    ])

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
  async getDonationById(id: string): Promise<PaymentWithDonation> {
    try {
      const donation = await this.prisma.payment.findFirstOrThrow({
        where: { id },
        include: { donations: true },
      })
      return donation
    } catch (err) {
      const msg = 'No Donation record with ID: ' + id
      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async getAffiliateDonationById(donationId: string, affiliateCode: string) {
    try {
      const donation = await this.prisma.payment.findFirstOrThrow({
        where: { id: donationId, affiliate: { affiliateCode: affiliateCode } },
      })
      return donation
    } catch (err) {
      const msg = 'No Donation record with ID: ' + donationId
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
    email?: string,
  ): Promise<Donation | null> {
    return await this.prisma.donation.findFirst({
      where: {
        id,
        payment: { status: PaymentStatus.succeeded },
        OR: [{ payment: { billingEmail: email } }, { person: { keycloakId } }],
      },

      include: {
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
  async createStripePayment(inputDto: CreateStripePaymentDto): Promise<Payment> {
    const intent = await this.stripeClient.paymentIntents.retrieve(inputDto.paymentIntentId)
    if (!intent.metadata.campaignId) {
      throw new BadRequestException('Campaign id is missing from payment intent metadata')
    }
    const campaignId = intent.metadata.camapaignId
    const campaign = await this.campaignService.validateCampaignId(campaignId)
    return this.createInitialDonationFromIntent(campaign, inputDto, intent)
  }

  /**
   * Refund a stipe payment donation
   * https://stripe.com/docs/api/refunds/create
   * @param inputDto Refund-stripe params
   * @returns {Promise<Stripe.Response<Stripe.Refund>>}
   */
  async refundStripePayment(paymentIntentId: string): Promise<Stripe.Response<Stripe.Refund>> {
    const intent = await this.stripeClient.paymentIntents.retrieve(paymentIntentId)
    if (!intent) {
      throw new BadRequestException('Payment Intent is missing from stripe')
    }

    if (!intent.metadata.campaignId) {
      throw new BadRequestException('Campaign id is missing from payment intent metadata')
    }

    return await this.stripeClient.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
    })
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
      const existingDonation = await tx.payment.findUnique({
        where: { extPaymentIntentId: donationDto.extPaymentIntentId },
      })

      if (!existingDonation) {
        const payment = await tx.payment.create({
          data: donationDto,
          include: {
            donations: true,
          },
        })

        await this.vaultService.incrementVaultAmount(
          payment.donations[0].targetVaultId,
          payment.donations[0].amount,
          tx,
        )
        return ImportStatus.SUCCESS
      }

      await this.prisma.payment.update({
        where: { extPaymentIntentId: donationDto.extPaymentIntentId },
        data: { ...donationDto, updatedAt: existingDonation.updatedAt },
      })
      return ImportStatus.UPDATED
    })
  }

  async updateAffiliateBankPayment(paymentsIds: string[], listOfVaults: VaultUpdate) {
    return await this.prisma.$transaction(async (tx) => {
      await Promise.all([
        this.vaultService.IncrementManyVaults(listOfVaults, tx),
        tx.payment.updateMany({
          where: { id: { in: paymentsIds } },
          data: { status: PaymentStatus.succeeded },
        }),
      ])
    })
  }

  async updateAffiliateDonations(donationId: string, affiliateId: string, status: PaymentStatus) {
    const donation = await this.prisma.payment.update({
      where: {
        id: donationId,
        affiliateId: affiliateId,
      },
      data: {
        status,
      },
    })
    return donation
  }
  /**
   * Updates the donation's status or donor. Note: completed donations cannot have status updates.
   * @param id
   * @param updatePaymentDto
   * @returns
   */
  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    try {
      // execute the below in prisma transaction
      return await this.prisma.$transaction(async (tx) => {
        const currentPayment = await tx.payment.findFirst({
          where: { id },
          include: {
            donations: {
              select: { personId: true, targetVaultId: true },
            },
          },
        })
        if (!currentPayment) {
          throw new NotFoundException(`Update failed. No donation found with ID: ${id}`)
        }

        if (
          currentPayment.status === PaymentStatus.succeeded &&
          updatePaymentDto.status &&
          updatePaymentDto.status !== PaymentStatus.succeeded
        ) {
          throw new BadRequestException('Succeeded donations cannot be updated.')
        }

        const status = updatePaymentDto.status || currentPayment.status
        let donorId = currentPayment.donations[0].personId
        let billingEmail: string | null = ''
        if (
          (updatePaymentDto.targetPersonId &&
            currentPayment.donations[0].personId !== updatePaymentDto.targetPersonId) ||
          updatePaymentDto.billingEmail
        ) {
          const targetDonor = await tx.person.findFirst({
            where: {
              OR: [
                { id: updatePaymentDto.targetPersonId },
                { email: updatePaymentDto.billingEmail },
              ],
            },
          })
          if (!targetDonor) {
            throw new NotFoundException(
              `Update failed. No person found with ID: ${updatePaymentDto.targetPersonId}`,
            )
          }
          donorId = targetDonor.id
          billingEmail = targetDonor.email
        }

        const donation = await tx.payment.update({
          where: { id },
          data: {
            status: status,
            donations: {
              updateMany: {
                where: { paymentId: id },
                data: {
                  personId: updatePaymentDto.targetPersonId ? donorId : undefined,
                },
              },
            },
            billingEmail: updatePaymentDto.billingEmail ? billingEmail : undefined,
            //In case of personId or billingEmail change, take the last updatedAt property to prevent any changes to updatedAt property
            updatedAt:
              updatePaymentDto.targetPersonId || updatePaymentDto.billingEmail
                ? currentPayment.updatedAt
                : undefined,
          },
        })

        if (
          currentPayment.status !== PaymentStatus.succeeded &&
          updatePaymentDto.status === PaymentStatus.succeeded &&
          donation.status === PaymentStatus.succeeded
        ) {
          await this.vaultService.incrementVaultAmount(
            currentPayment.donations[0].targetVaultId,
            currentPayment.amount,
            tx,
          )
        }
        return donation
      }) //end of transaction
    } catch (err) {
      Logger.warn(err.message || err)
      throw err
    }
  }

  async softDelete(ids: string[]): Promise<Prisma.BatchPayload> {
    try {
      return await this.prisma.payment.updateMany({
        where: { id: { in: ids } },
        data: {
          status: PaymentStatus.deleted,
        },
      })
    } catch (err) {
      const msg = `Delete failed. No Donation found with given ID`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async invalidate(id: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const donation = await this.getDonationById(id)

        if (donation.status === PaymentStatus.succeeded) {
          await this.vaultService.decrementVaultAmount(
            donation.donations[0].targetVaultId,
            donation.amount,
            tx,
          )
        }

        await tx.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.invalid,
          },
        })
      })
    } catch (err) {
      Logger.warn(err.message || err)
      const msg = `Invalidation failed. No Donation found with given ID.`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async getDonationsByUser(keycloakId: string, email?: string) {
    const donations = await this.prisma.donation.findMany({
      where: {
        OR: [{ person: { keycloakId } }, { payment: { billingEmail: email } }],
      },
      include: {
        payment: {
          select: {
            status: true,
            provider: true,
          },
        },
        targetVault: {
          select: {
            campaign: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    const total = donations.reduce((acc, current) => {
      if (current.payment.status === PaymentStatus.succeeded) {
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
    const totalMoney = await this.prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: { status: PaymentStatus.succeeded },
    })

    return { total: totalMoney._sum.amount }
  }

  async getDonorsCount() {
    const donorsCount = await this.prisma.$queryRaw<{
      count: number
    }>`SELECT COUNT (*)::INTEGER FROM (SELECT DISTINCT billing_name FROM payments WHERE status::text=${PaymentStatus.succeeded}) AS unique_donors`

    return { count: donorsCount[0].count }
  }

  /**
   *  @param response  - Response object to be used for the export to excel file
   */
  async exportToExcel(query: DonationQueryDto, response: Response) {
    //get donations from db based on the filter parameters
    const { items } = await this.listDonations(
      query?.paymentId,
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
