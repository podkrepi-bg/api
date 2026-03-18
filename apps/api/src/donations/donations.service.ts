import Stripe from 'stripe'
import { ConfigService } from '@nestjs/config'

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
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
import { eurToBgn } from '../common/money'

import { CampaignService } from '../campaign/campaign.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from '../vault/vault.service'
import { ExportService } from '../export/export.service'

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
import {
  NotificationService,
  donationNotificationSelect,
} from '../sockets/notifications/notification.service'
import { PaymentData } from './helpers/payment-intent-helpers'
import { shouldAllowStatusChange } from './helpers/donation-status-updates'

@Injectable()
export class DonationsService {
  constructor(
    private campaignService: CampaignService,
    private prisma: PrismaService,
    private vaultService: VaultService,
    private exportService: ExportService,
    private notificationService: NotificationService,
  ) {}

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

  /**
   * Lists all donations without confidential fields
   * @param campaignId (Optional) Filter by campaign id
   * @param status (Optional) Filter by campaign status
   * @param pageIndex (Optional)
   * @param pageSize (Optional)
   * @param sortBy (Optional) Field to sort by: 'createdAt' | 'amount'
   * @param sortOrder (Optional) Sort order: 'asc' | 'desc'
   * @param type (Optional) Filter by type
   */

  async listDonationsPublic(
    campaignId?: string,
    status?: PaymentStatus,
    pageIndex?: number,
    pageSize?: number,
    sortBy?: string,
    sortOrder?: string,
  ) {
    // Build orderBy based on sortBy parameter
    const validSortFields = ['createdAt', 'amount']
    const validSortOrders = ['asc', 'desc']
    const orderField = validSortFields.includes(sortBy || '') ? sortBy : 'createdAt'
    const orderDirection = validSortOrders.includes(sortOrder || '') ? sortOrder : 'desc'
    const orderBy = { [orderField as string]: orderDirection }

    const [data, count] = await this.prisma.$transaction([
      this.prisma.donation.findMany({
        where: {
          OR: [{ payment: { status: status } }, { payment: { status: PaymentStatus.guaranteed } }],
          targetVault: { campaignId },
        },
        orderBy: [orderBy],
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
      payment: {
        status: paymentStatus,
        provider: paymentProvider,
      },
      OR: [
        { payment: { billingEmail: { contains: search } } },
        { payment: { billingName: { contains: search } } },
        { person: { firstName: { contains: search } } },
        { person: { lastName: { contains: search } } },
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
      id: paymentId,
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
   *  Get payment by id
   * @param id payment id
   * @returns  {Promise<PaymentWithDonation>} Payment
   * @throws NotFoundException if no donation is found
   */
  async getPaymentById(id: string): Promise<PaymentWithDonation> {
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

  async getDonationByPaymentIntent(id: string): Promise<{ id: string } | null> {
    return await this.prisma.donation.findFirst({
      where: { payment: { extPaymentIntentId: id } },
      select: { id: true },
    })
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
  async update(paymentId: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    try {
      // execute the below in prisma transaction
      return await this.prisma.$transaction(async (tx) => {
        const currentPayment = await tx.payment.findFirst({
          where: { id: paymentId },
          include: {
            donations: {
              select: { personId: true, targetVaultId: true },
            },
          },
        })
        if (!currentPayment) {
          throw new NotFoundException(`Update failed. No payment found with ID: ${paymentId}`)
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
          where: { id: paymentId },
          data: {
            status: status,
            donations: {
              update: {
                where: { id: updatePaymentDto.donationId ?? '' },
                data: {
                  personId: updatePaymentDto.targetPersonId ? donorId : undefined,
                },
              },
            },
            billingEmail: updatePaymentDto.billingEmail ? billingEmail : undefined,
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

  async updateDonationType(donationId: string, type: DonationType): Promise<Donation> {
    try {
      return await this.prisma.donation.update({
        where: { id: donationId },
        data: { type },
      })
    } catch (err) {
      Logger.warn(err.message || err)
      throw new NotFoundException(`Update failed. No donation found with ID: ${donationId}`)
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
        const donation = await this.getPaymentById(id)

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
    }>`SELECT COUNT (*)::INTEGER FROM (SELECT DISTINCT billing_name FROM api.payments WHERE status::text=${PaymentStatus.succeeded}) AS unique_donors`

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
      amountBGN: eurToBgn(donation.amount, true),
      person: donation.person
        ? `${donation.person.firstName} ${donation.person.lastName}`
        : 'Anonymous Donor',
      email: donation.person ? donation.person.email : '',
      campaignId: donation.targetVault.campaign.id,
      status: donation.payment.status,
      provider: donation.payment.provider,
      currency: donation.payment.currency,
      billingName: donation.payment.billingName,
      billingEmail: donation.payment.billingEmail,
    }))

    const donationExcelTemplate = getTemplateByTable('donations')

    await this.exportService.exportToExcel(
      response,
      donationsMappedForExport,
      donationExcelTemplate,
    )
  }

  async syncDonationAmountWithPayment(donationId: string) {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { donations: { some: { id: donationId } } },
      })
      if (!payment) throw new NotFoundException('No payment found for this donation')
      return await this.prisma.donation.update({
        where: { id: donationId },
        data: {
          amount: payment.amount,
        },
      })
    })
  }

  /**
   * Creates or Updates an incoming donation depending on the newDonationStatus attribute
   * @param campaign
   * @param paymentData
   * @param newDonationStatus
   * @param metadata
   * @returns donation.id of the created/updated donation
   */
  async updateDonationPayment(
    campaign: Campaign,
    paymentData: PaymentData,
    newDonationStatus: PaymentStatus,
  ): Promise<string | undefined> {
    const campaignId = campaign.id
    Logger.debug('Update donation to status: ' + newDonationStatus, {
      campaignId,
      paymentIntentId: paymentData.paymentIntentId,
    })

    //Update existing donation or create new in a transaction that
    //also increments the vault amount and marks campaign as completed
    //if target amount is reached
    return await this.prisma.$transaction(async (tx) => {
      let donationId
      // Find donation by extPaymentIntentId
      const existingDonation = await this.findExistingDonation(tx, paymentData)

      //if missing create the donation with the incoming status
      if (!existingDonation) {
        const newDonation = await this.createIncomingDonation(
          tx,
          paymentData,
          newDonationStatus,
          campaign,
        )
        donationId = newDonation.id
      }
      //donation exists, so check if it is safe to update it
      else {
        const updatedDonation = await this.updateDonationIfAllowed(
          tx,
          existingDonation,
          newDonationStatus,
          paymentData,
        )
        donationId = updatedDonation?.id
      }

      return donationId
    }) //end of the transaction scope
  }

  private async updateDonationIfAllowed(
    tx: Prisma.TransactionClient,
    payment: PaymentWithDonation,
    newDonationStatus: PaymentStatus,
    paymentData: PaymentData,
  ) {
    if (shouldAllowStatusChange(payment.status, newDonationStatus)) {
      try {
        const updatedDonation = await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: newDonationStatus,
            amount: paymentData.netAmount,
            extCustomerId: paymentData.stripeCustomerId,
            extPaymentMethodId: paymentData.paymentMethodId,
            extPaymentIntentId: paymentData.paymentIntentId,
            billingName: paymentData.billingName,
            billingEmail: paymentData.billingEmail,
            donations: {
              updateMany: {
                where: { paymentId: payment.id },
                data: {
                  amount: paymentData.netAmount,
                },
              },
            },
          },
          select: donationNotificationSelect,
        })

        //if donation is switching to successful, increment the vault amount and send notification
        if (
          payment.status != PaymentStatus.succeeded &&
          newDonationStatus === PaymentStatus.succeeded
        ) {
          await this.vaultService.incrementVaultAmount(
            payment.donations[0].targetVaultId,
            paymentData.netAmount,
            tx,
          )
          this.notificationService.sendNotification('successfulDonation', {
            ...updatedDonation,
            person: updatedDonation.donations[0].person,
          })
        } else if (
          payment.status === PaymentStatus.succeeded &&
          newDonationStatus === PaymentStatus.refund
        ) {
          await this.vaultService.decrementVaultAmount(
            payment.donations[0].targetVaultId,
            paymentData.netAmount,
            tx,
          )
          this.notificationService.sendNotification('successfulRefund', {
            ...updatedDonation,
            person: updatedDonation.donations[0].person,
          })
        }
        return updatedDonation
      } catch (error) {
        Logger.error(
          `Error wile updating donation with paymentIntentId: ${paymentData.paymentIntentId} in database. Error is: ${error}`,
        )
        throw new InternalServerErrorException(error)
      }
    }
    //donation exists but we need to skip because previous status is from later event than the incoming
    else {
      Logger.warn(
        `Skipping update of donation with paymentIntentId: ${paymentData.paymentIntentId}
        and status: ${newDonationStatus} because the event comes after existing donation with status: ${payment.status}`,
      )
    }
  }

  private async createIncomingDonation(
    tx: Prisma.TransactionClient,
    paymentData: PaymentData,
    newDonationStatus: PaymentStatus,
    campaign: Campaign,
  ) {
    Logger.debug(
      'No donation exists with extPaymentIntentId: ' +
        paymentData.paymentIntentId +
        ' Creating new donation with status: ' +
        newDonationStatus,
    )

    const vault = await tx.vault.findFirstOrThrow({ where: { campaignId: campaign.id } })
    const targetVaultData = { connect: { id: vault.id } }

    try {
      const donation = await tx.payment.create({
        data: {
          amount: paymentData.netAmount,
          chargedAmount: paymentData.chargedAmount,
          currency: campaign.currency,
          provider: paymentData.paymentProvider,
          type: PaymentType.single,
          status: newDonationStatus,
          extCustomerId: paymentData.stripeCustomerId ?? '',
          extPaymentIntentId: paymentData.paymentIntentId,
          extPaymentMethodId: paymentData.paymentMethodId ?? '',
          billingName: paymentData.billingName,
          billingEmail: paymentData.billingEmail,
          donations: {
            create: {
              amount: paymentData.netAmount,
              type: paymentData.type as DonationType,
              person: paymentData.personId ? { connect: { id: paymentData.personId } } : {},
              targetVault: targetVaultData,
            },
          },
        },
        select: donationNotificationSelect,
      })

      if (newDonationStatus === PaymentStatus.succeeded) {
        await this.vaultService.incrementVaultAmount(
          donation.donations[0].targetVaultId,
          donation.amount,
          tx,
        )
        this.notificationService.sendNotification('successfulDonation', donation.donations[0])
      }

      return donation
    } catch (error) {
      Logger.error(
        `Error while creating donation with paymentIntentId: ${paymentData.paymentIntentId} and status: ${newDonationStatus} . Error is: ${error}`,
      )
      throw new InternalServerErrorException(error)
    }
  }

  private async findExistingDonation(tx: Prisma.TransactionClient, paymentData: PaymentData) {
    //first try to find by paymentIntentId
    let donation = await tx.payment.findUnique({
      where: { extPaymentIntentId: paymentData.paymentIntentId },
      include: { donations: true },
    })

    // if not found by paymentIntent, check for if this is payment on subscription
    // check for UUID length of personId
    // subscriptions always have a personId
    if (!donation && paymentData.personId && paymentData.personId.length === 36) {
      // search for a subscription donation
      // for subscriptions, we don't have a paymentIntentId
      donation = await tx.payment.findFirst({
        where: {
          status: PaymentStatus.initial,
          chargedAmount: paymentData.chargedAmount,
          extPaymentMethodId: 'subscription',
          donations: {
            some: {
              personId: paymentData.personId,
            },
          },
        },
        include: { donations: true },
      })
      if (donation) {
        Logger.debug('Donation found by subscription: ', donation)
      }
    }
    return donation
  }
}
