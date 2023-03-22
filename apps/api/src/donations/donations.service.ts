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
import { donationWithPerson, DonationWithPerson } from './validators/donation.validator'
import { CreateDonationFromIntentDto } from './dto/create-donation-from-intent.dto'
import { ImportStatus } from '../bank-transactions-file/dto/bank-transactions-import-status.dto'
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto'

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

  /**
   * Create a payment intent for a donation
   * https://stripe.com/docs/api/payment_intents/create
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async createStripeDonationFromIntent(inputDto: CreateDonationFromIntentDto): Promise<Donation> {
    const intent = await this.stripeClient.paymentIntents.retrieve(inputDto.paymentIntentId, {
      expand: ['customer'],
    })
    if (!intent?.metadata?.campaignId) {
      throw new BadRequestException('Campaign id is missing from setup intent metadata')
    }
    const campaignId = intent.metadata.camapaignId
    const campaign = await this.campaignService.validateCampaignId(campaignId)
    const customer = intent.customer as Stripe.Customer
    if (!customer.email) {
      throw new BadRequestException('Customer email is missing from setup intent')
    }
    Logger.debug('[ CreateInitialDonationFromIntent]', {
      campaignId: campaign.id,
      amount: intent.amount,
      paymentIntentId: intent.id,
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

    if (typeof intent.customer !== 'string') {
      throw new BadRequestException('Payment intent customer is expected to be a string id')
    }
    /**
     * Create or update initial donation object
     */
    const donation = await this.prisma.donation.upsert({
      where: { extPaymentIntentId: intent.id },
      create: {
        amount: inputDto.amount,
        chargedAmount: intent.amount,
        currency: campaign.currency,
        provider: PaymentProvider.stripe,
        type: DonationType.donation,
        status: DonationStatus.succeeded,
        extCustomerId: intent.customer,
        extPaymentIntentId: intent.id,
        extPaymentMethodId: intent.payment_method as string,
        billingEmail: customer.email,
        targetVault: targetVaultData,
      },
      update: {
        amount: inputDto.amount, //this will be updated on successful payment event
        chargedAmount: intent.amount,
        currency: campaign.currency,
        provider: PaymentProvider.stripe,
        type: DonationType.donation,
        status: DonationStatus.succeeded,
        extCustomerId: customer.id,
        extPaymentMethodId: intent.payment_method as string,
        billingEmail: customer.email,
        targetVault: targetVaultData,
      },
    })

    if (!inputDto.isAnonymous) {
      await this.prisma.donation.update({
        where: { id: donation.id },
        data: {
          person: {
            connectOrCreate: {
              where: {
                email: customer.email,
              },
              create: {
                firstName: inputDto.firstName ?? '',
                lastName: inputDto.lastName ?? '',
                email: inputDto.personEmail,
                phone: inputDto.phone,
              },
            },
          },
        },
      })
    }

    return donation
  }

  async createSubscriptionDonation(
    user: KeycloakTokenParsed,
    subscriptionPaymentDto: CreateSubscriptionPaymentDto,
  ): Promise<Stripe.PaymentIntent> {
    const customer = await this.stripeClient.customers.create({
      email: subscriptionPaymentDto.email,
      metadata: {
        keycloakId: user.sub,
      },
    })
    const person = await this.prisma.person.findFirst({
      where: { keycloakId: user.sub },
    })
    if (!person) {
      throw new NotFoundException('Person not found')
    }
    const product = await this.stripeClient.products.create({
      name: `Donation of ${subscriptionPaymentDto.amount}`,
      description: `Donation of ${subscriptionPaymentDto.amount} to campaign ${subscriptionPaymentDto.campaignId} by person ${person.email}`,
    })
    const subscription = await this.stripeClient.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            unit_amount: subscriptionPaymentDto.amount,
            currency: subscriptionPaymentDto.currency,
            product: product.id,
            recurring: { interval: 'month' },
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      metadata: {
        campaignId: subscriptionPaymentDto.campaignId,
        personId: person.id,
      },
    })
    const invoice = await this.stripeClient.invoices.retrieve(
      subscription.latest_invoice as string,
      {
        expand: ['payment_intent'],
      },
    )
    return invoice.payment_intent as Stripe.PaymentIntent
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
