import {
  Prisma,
  Campaign,
  CampaignState,
  CampaignType,
  Donation,
  DonationStatus,
  DonationType,
  Vault,
  CampaignFileRole,
  CampaignNewsState,
  NotificationList,
  EmailType,
} from '@prisma/client'
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from '../vault/vault.service'
import { shouldAllowStatusChange } from '../donations/helpers/donation-status-updates'
import { PaymentData } from '../donations/helpers/payment-intent-helpers'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'
import { CampaignSummaryDto } from './dto/campaign-summary.dto'
import {
  AdminCampaignListItem,
  AdminCampaignListItemSelect,
  CampaignListItem,
  CampaignListItemSelect,
} from './dto/list-campaigns.dto'
import {
  NotificationService,
  donationNotificationSelect,
} from '../sockets/notifications/notification.service'
import { DonationMetadata } from '../donations/dontation-metadata.interface'
import { Expense } from '@prisma/client'
import { SendGridParams } from '../notifications/providers/notifications.sendgrid.types'
import * as NotificationData from '../notifications/notification-data.json'
import { ConfigService } from '@nestjs/config'
import { DateTime } from 'luxon'
import { CampaignSubscribeDto } from './dto/campaign-subscribe.dto'
import { MarketingNotificationsService } from '../notifications/notifications.service'

@Injectable()
export class CampaignService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    @Inject(forwardRef(() => VaultService)) private vaultService: VaultService,
    @Inject(forwardRef(() => PersonService)) private personService: PersonService,
    @Inject(forwardRef(() => MarketingNotificationsService))
    private marketingNotificationsService: MarketingNotificationsService,
    private readonly config: ConfigService,
  ) {}

  async listCampaigns(): Promise<CampaignListItem[]> {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: {
        endDate: 'asc',
      },
      where: { state: { in: [CampaignState.active, CampaignState.complete] } },
      ...CampaignListItemSelect,
    })
    const campaignSums = await this.getCampaignSums()

    for (const campaign of campaigns) {
      campaign['summary'] = this.getVaultAndDonationSummaries(campaign.id, campaignSums)
    }

    return campaigns
  }

  async listAllCampaigns(): Promise<AdminCampaignListItem[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { NOT: { state: { in: [CampaignState.deleted] } } },
      orderBy: {
        updatedAt: 'desc',
      },
      ...AdminCampaignListItemSelect,
    })
    const campaignSums = await this.getCampaignSums()

    for (const campaign of campaigns) {
      campaign['summary'] = this.getVaultAndDonationSummaries(campaign.id, campaignSums)
    }

    return campaigns
  }

  async getCampaignSums(campaignIds?: string[]): Promise<CampaignSummaryDto[]> {
    let campaignSums: CampaignSummaryDto[] = []

    const result = await this.prisma.$queryRaw<CampaignSummaryDto[]>`SELECT
    SUM(d.reached)::INTEGER as "reachedAmount",
    (SUM(v.amount) - SUM(v."blockedAmount"))::INTEGER as "currentAmount",
    SUM(v."blockedAmount")::INTEGER as "blockedAmount",
    SUM(w."withdrawnAmount")::INTEGER as "withdrawnAmount",
    SUM(d.donors)::INTEGER as donors,
    v.campaign_id as id
    FROM api.vaults v
    LEFT JOIN (
        SELECT target_vault_id, sum(amount) as reached, count(id) as donors
        FROM api.donations d
        WHERE status = 'succeeded'
        GROUP BY target_vault_id
      ) as d
      ON d.target_vault_id = v.id
    LEFT JOIN (
      SELECT source_vault_id, sum(amount) as "withdrawnAmount"
        FROM api.withdrawals w
        WHERE status = 'succeeded'
        GROUP BY source_vault_id
      ) as w
      ON w.source_vault_id = v.id
    GROUP BY v.campaign_id
    ${
      campaignIds && campaignIds.length > 0
        ? Prisma.sql`HAVING v.campaign_id::TEXT in (${Prisma.join(campaignIds)})`
        : Prisma.empty
    }`

    campaignSums = result || []

    return campaignSums
  }

  async getCampaignById(campaignId: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId },
      include: {
        campaignFiles: true,
        incomingTransfers: { select: { amount: true } },
      },
    })
    if (!campaign) {
      Logger.warn('No campaign record with ID: ' + campaignId)
      throw new NotFoundException('No campaign record with ID: ' + campaignId)
    }
    const campaignSums = await this.getCampaignSums([campaign.id])

    campaign['summary'] = this.getVaultAndDonationSummaries(campaign.id, campaignSums)

    return campaign
  }

  async isUserCampaign(keycloakId: string, slug: string): Promise<boolean> {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        slug,
        OR: [
          { beneficiary: { person: { keycloakId } } },
          { coordinator: { person: { keycloakId } } },
          { organizer: { person: { keycloakId } } },
        ],
      },
    })

    return !!campaign
  }

  async getUserCampaigns(keycloakId: string): Promise<Campaign[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        OR: [
          { beneficiary: { person: { keycloakId } } },
          { coordinator: { person: { keycloakId } } },
          { organizer: { person: { keycloakId } } },
        ],
      },
      orderBy: {
        endDate: 'asc',
      },
      include: {
        campaignType: { select: { name: true, slug: true } },
        beneficiary: {
          select: {
            id: true,
            type: true,
            person: { select: { id: true, firstName: true, lastName: true } },
            company: { select: { id: true, companyName: true } },
          },
        },
        coordinator: { select: { person: { select: { firstName: true, lastName: true } } } },
        organizer: { select: { person: { select: { firstName: true, lastName: true } } } },
        incomingTransfers: { select: { amount: true } },
        outgoingTransfers: { select: { amount: true } },
      },
    })
    const campaignSums = await this.getCampaignSums()

    for (const campaign of campaigns) {
      campaign['summary'] = this.getVaultAndDonationSummaries(campaign.id, campaignSums)
    }

    return campaigns
  }

  async getUserDonatedCampaigns(keycloakId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { vaults: { some: { donations: { some: { person: { keycloakId } } } } } },
      orderBy: {
        endDate: 'asc',
      },
      include: {
        campaignType: { select: { name: true, slug: true } },
        beneficiary: {
          select: {
            id: true,
            type: true,
            person: { select: { id: true, firstName: true, lastName: true } },
            company: { select: { id: true, companyName: true } },
          },
        },
        coordinator: { select: { person: { select: { firstName: true, lastName: true } } } },
        organizer: { select: { person: { select: { firstName: true, lastName: true } } } },
        incomingTransfers: { select: { amount: true } },
        outgoingTransfers: { select: { amount: true } },
      },
    })
    const campaignSums = await this.getCampaignSums()

    for (const campaign of campaigns) {
      campaign['summary'] = this.getVaultAndDonationSummaries(campaign.id, campaignSums)
    }

    return campaigns
  }

  // Check if the campaign exists by coordinator or organizer
  async verifyCampaignOwner(campaignId: string, personId: string): Promise<Campaign | null> {
    const campaignByCoordinator = await this.prisma.campaign.findFirst({
      where: { id: campaignId, coordinator: { personId } },
      include: { coordinator: true, organizer: true },
    })

    if (campaignByCoordinator !== null) {
      return campaignByCoordinator
    }

    const campaignByOrganizer = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organizer: { personId } },
      include: { coordinator: true, organizer: true },
    })

    return campaignByOrganizer
  }

  async getCampaignByIdWithPersonIds(id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: id },
      select: {
        beneficiary: { select: { person: { select: { keycloakId: true } } } },
        coordinator: { select: { person: { select: { keycloakId: true } } } },
        organizer: { select: { person: { select: { keycloakId: true } } } },
        vaults: true,
        targetAmount: true,
        notificationLists: true,
        state: true,
        slug: true,
        title: true,
        id: true,
      },
    })

    return campaign
  }

  async subscribeToCampaignNotification(campaign_id: string, data: CampaignSubscribeDto) {
    // Check if campaign exists
    let campaign: Awaited<ReturnType<CampaignService['getCampaignByIdWithPersonIds']>>
    try {
      campaign = await this.getCampaignByIdWithPersonIds(campaign_id)
    } catch (e) {
      Logger.error(e)
      throw new BadRequestException('Failed to get campaign info')
    }

    if (!campaign) throw new NotFoundException('Campaign not found')

    if (campaign.state !== CampaignState.active) throw new BadRequestException('Campaign inactive')

    // Check if user is registered
    const registered = await this.personService.findByEmail(data.email)

    // Add to marketing platform directly
    if (registered) {
      const contact: SendGridParams['ContactData'] = {
        email: data.email,
        first_name: registered?.firstName || '',
        last_name: registered?.lastName || '',
      }

      const listIds: string[] = []

      // Check if the campaign has a notification list
      if (!campaign.notificationLists?.length) {
        const campaignList = await this.createCampaignNotificationList(campaign)
        // Add email to this campaign's notification list
        listIds.push(campaignList)
      } else {
        listIds.push(campaign.notificationLists[0].id)
      }

      // Add email to general marketing notifications list
      const mainList = this.config.get('sendgrid.marketingListId')
      if (mainList) {
        listIds.push(mainList)
      }

      try {
        await this.marketingNotificationsService.provider.addContactsToList({
          contacts: [contact],
          list_ids: listIds,
        })
      } catch (e) {
        Logger.error('Failed to subscribe email', e)
        throw new BadRequestException('Failed to subscribe email')
      }

      // If no prior consent has been given by a registered user
      if (!registered.newsletter)
        try {
          await this.personService.update(registered.id, { newsletter: true })
        } catch (e) {
          Logger.error('Failed to update user consent', e)
          throw new BadRequestException('Failed to update user consent')
        }
    }

    // If the email is not registered - send confirmation email
    else if (!registered)
      try {
        const record = await this.prisma.unregisteredNotificationConsent.upsert({
          where: { email: data.email },
          create: { email: data.email },
          update: {},
        })

        await this.marketingNotificationsService.sendConfirmEmail({
          record_id: record.id,
          email: data.email,
          campaignId: campaign.id,
        })
      } catch (e) {
        Logger.error('Failed to send confirmation email', e)
        throw new BadRequestException('Failed to send confirmation email')
      }
  }

  async getCampaignByVaultIdAndPersonId(
    vaultId: string,
    personId: string,
  ): Promise<{ vaults: Vault[]; id: string } | null> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { coordinator: { personId } },
      select: { id: true, vaults: { where: { id: vaultId } } },
    })
    return campaign
  }

  async getCampaignBySlug(slug: string): Promise<Campaign> {
    const includeFilter = {
      campaignType: {
        select: { name: true, slug: true, category: true },
      },
      beneficiary: {
        select: {
          id: true,
          type: true,
          publicData: true,
          person: { select: { id: true, firstName: true, lastName: true } },
          company: { select: { id: true, companyName: true } },
        },
      },
      coordinator: {
        select: {
          id: true,
          person: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
      organizer: {
        select: {
          id: true,
          person: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
      campaignFiles: true,
    }

    let campaign = await this.prisma.campaign.findFirst({
      where: { slug },
      include: { ...includeFilter },
    })

    // Check the Archive
    if (!campaign) {
      try {
        const result = await this.prisma.slugArchive.findUnique({
          where: {
            slug,
          },
          select: {
            campaign: { include: { ...includeFilter } },
          },
        })

        campaign = result?.campaign || null
      } catch {
        // Continue on error
      }
    }

    if (campaign === null) {
      Logger.warn('No campaign record with slug: ' + slug)
      throw new NotFoundException('No campaign record with slug: ' + slug)
    }

    const campaignSums = await this.getCampaignSums([campaign.id])

    campaign['summary'] = this.getVaultAndDonationSummaries(campaign.id, campaignSums)
    campaign['campaignNews'] = await this.getCampaignNews(campaign.id)

    const vault = await this.getCampaignVault(campaign.id)
    if (vault) {
      campaign['defaultVault'] = vault?.id
    }

    return campaign
  }

  async getCampaignByPaymentReference(paymentReference: string) {
    return await this.prisma.campaign.findFirst({
      where: { paymentReference: paymentReference },
      include: {
        vaults: true,
      },
    })
  }

  async listCampaignTypes(): Promise<CampaignType[]> {
    return this.prisma.campaignType.findMany()
  }

  async createCampaign(inputDto: CreateCampaignDto, personId?: string): Promise<Campaign> {
    let createInput
    if (personId) {
      createInput = {
        data: {
          ...inputDto.toEntity(),
          ...{
            coordinator: {
              connectOrCreate: {
                where: { personId },
                create: { personId },
              },
            },
          },
        },
        include: { coordinator: true },
      }
    } else {
      createInput = {
        data: inputDto.toEntity(),
      }
    }

    return this.prisma.campaign.create(createInput)
  }

  async getCampaignVault(campaignId: string): Promise<Vault | null> {
    return this.prisma.vault.findFirst({ where: { campaignId } })
  }

  async getDonationsForCampaign(
    campaignId: string,
    pageIndex?: number,
    pageSize?: number,
  ): Promise<
    Omit<
      Donation,
      | 'personId'
      | 'targetVaultId'
      | 'extCustomerId'
      | 'extPaymentIntentId'
      | 'extPaymentMethodId'
      | 'billingName'
      | 'billingEmail'
    >[]
  > {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId },
      include: {
        vaults: {
          select: {
            id: true,
          },
        },
      },
    })

    if (campaign === null) {
      Logger.warn('No campaign record with id: ' + campaign)
      throw new NotFoundException('No campaign record with id: ' + campaign)
    }

    const whereVaultIds = campaign.vaults.map((vault) => {
      return { targetVaultId: vault.id }
    })

    const donations = await this.prisma.donation.findMany({
      where: {
        OR: whereVaultIds,
      },
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
        targetVault: { select: { name: true } },
      },
      skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
      take: pageSize ? pageSize : undefined,
    })

    return donations
  }

  async getDonationByIntentId(paymentIntentId: string): Promise<Donation | null> {
    return this.prisma.donation.findFirst({ where: { extPaymentIntentId: paymentIntentId } })
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
    newDonationStatus: DonationStatus,
    metadata?: DonationMetadata,
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

      //For successful donations we will also need to link them to user if not marked as anonymous
      if (donationId && newDonationStatus === DonationStatus.succeeded) {
        if (metadata?.isAnonymous !== 'true') {
          await tx.donation.update({
            where: { id: donationId },
            data: {
              person: {
                connect: {
                  email: paymentData.billingEmail,
                },
              },
            },
          })
        }
      }

      return donationId
    }) //end of the transaction scope
  }

  private async updateDonationIfAllowed(
    tx: Prisma.TransactionClient,
    donation: Donation,
    newDonationStatus: DonationStatus,
    paymentData: PaymentData,
  ) {
    if (shouldAllowStatusChange(donation.status, newDonationStatus)) {
      try {
        const updatedDonation = await tx.donation.update({
          where: {
            id: donation.id,
          },
          data: {
            status: newDonationStatus,
            amount: paymentData.netAmount,
            extCustomerId: paymentData.stripeCustomerId,
            extPaymentMethodId: paymentData.paymentMethodId,
            extPaymentIntentId: paymentData.paymentIntentId,
            billingName: paymentData.billingName,
            billingEmail: paymentData.billingEmail,
          },
          select: donationNotificationSelect,
        })

        //if donation is switching to successful, increment the vault amount and send notification
        if (
          donation.status != DonationStatus.succeeded &&
          newDonationStatus === DonationStatus.succeeded
        ) {
          await this.vaultService.incrementVaultAmount(
            donation.targetVaultId,
            paymentData.netAmount,
            tx,
          )
          this.notificationService.sendNotification('successfulDonation', {
            ...updatedDonation,
            person: updatedDonation.person,
          })
        } else if (
          donation.status === DonationStatus.succeeded &&
          newDonationStatus === DonationStatus.refund
        ) {
          await this.vaultService.decrementVaultAmount(
            donation.targetVaultId,
            paymentData.netAmount,
            tx,
          )
          this.notificationService.sendNotification('successfulRefund', {
            ...updatedDonation,
            person: updatedDonation.person,
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
        and status: ${newDonationStatus} because the event comes after existing donation with status: ${donation.status}`,
      )
    }
  }

  private async createIncomingDonation(
    tx: Prisma.TransactionClient,
    paymentData: PaymentData,
    newDonationStatus: DonationStatus,
    campaign: Campaign,
  ) {
    Logger.debug(
      'No donation exists with extPaymentIntentId: ' +
        paymentData.paymentIntentId +
        ' Creating new donation with status: ' +
        newDonationStatus,
    )

    /**
     * Create or connect campaign vault
     */
    const vault = await tx.vault.findFirst({ where: { campaignId: campaign.id } })
    const targetVaultData = vault
      ? // Connect the existing vault to this donation
        { connect: { id: vault.id } }
      : // Create new vault for the campaign
        { create: { campaignId: campaign.id, currency: campaign.currency, name: campaign.title } }

    try {
      const donation = await tx.donation.create({
        data: {
          amount: paymentData.netAmount,
          chargedAmount: paymentData.chargedAmount,
          currency: campaign.currency,
          targetVault: targetVaultData,
          provider: paymentData.paymentProvider,
          type: DonationType.donation,
          status: newDonationStatus,
          extCustomerId: paymentData.stripeCustomerId ?? '',
          extPaymentIntentId: paymentData.paymentIntentId,
          extPaymentMethodId: paymentData.paymentMethodId ?? '',
          billingName: paymentData.billingName,
          billingEmail: paymentData.billingEmail,
          person: paymentData.personId ? { connect: { id: paymentData.personId } } : {},
        },
        select: donationNotificationSelect,
      })

      if (newDonationStatus === DonationStatus.succeeded) {
        await this.vaultService.incrementVaultAmount(donation.targetVaultId, donation.amount, tx)
        this.notificationService.sendNotification('successfulDonation', donation)
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
    let donation = await tx.donation.findUnique({
      where: { extPaymentIntentId: paymentData.paymentIntentId },
    })

    // if not found by paymentIntent, check for if this is payment on subscription
    // check for UUID length of personId
    // subscriptions always have a personId
    if (!donation && paymentData.personId && paymentData.personId.length === 36) {
      // search for a subscription donation
      // for subscriptions, we don't have a paymentIntentId
      donation = await tx.donation.findFirst({
        where: {
          status: DonationStatus.initial,
          personId: paymentData.personId,
          chargedAmount: paymentData.chargedAmount,
          extPaymentMethodId: 'subscription',
        },
      })
      Logger.debug('Donation found by subscription: ', donation)
    }
    return donation
  }

  async createDonationWish(wish: string, donationId: string, campaignId: string) {
    const person = await this.prisma.donation.findUnique({ where: { id: donationId } }).person()
    await this.prisma.donationWish.upsert({
      where: { donationId },
      create: {
        message: wish,
        donationId,
        campaignId,
        personId: person?.id,
      },
      update: {
        message: wish,
        donationId,
        campaignId,
        personId: person?.id,
      },
    })
  }

  async validateCampaignId(campaignId: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(campaignId)
    return this.validateCampaign(campaign)
  }

  async validateCampaign(campaign: Campaign): Promise<Campaign> {
    const canAcceptDonation = await this.canAcceptDonations(campaign)
    if (!canAcceptDonation) {
      throw new NotAcceptableException(
        'Campaign cannot accept donations in state: ' + campaign.state,
      )
    }
    return campaign
  }

  async canAcceptDonations(campaign: Campaign): Promise<boolean> {
    const validStates: CampaignState[] = [CampaignState.active, CampaignState.approved]
    if (campaign.allowDonationOnComplete) {
      validStates.push(CampaignState.complete)
    }

    if (!validStates.includes(campaign.state)) {
      return false
    }

    return true
  }

  /**
   * Call after executing a successful donation and adding the amount to a vault.
   * This will set the campaign state to 'complete' if the campaign's target amount has been reached
   */
  public async updateCampaignStatusIfTargetReached(
    campaignId: string,
    tx: Prisma.TransactionClient,
  ) {
    const campaign = await tx.campaign.findFirst({
      where: {
        id: campaignId,
      },
      select: {
        vaults: true,
        title: true,
        startDate: true,
        endDate: true,
        targetAmount: true,
        slug: true,
        id: true,
        state: true,
        notificationLists: true,
      },
    })

    if (campaign && campaign.state !== CampaignState.complete && campaign.targetAmount) {
      const actualAmount = campaign.vaults.map((vault) => vault.amount).reduce((a, b) => a + b, 0)
      if (actualAmount >= campaign.targetAmount) {
        await tx.campaign.update({
          where: {
            id: campaign.id,
          },
          data: {
            state: CampaignState.complete,
          },
        })
      }

      // TODO - should be managed from the admin UI
      const percentRaised = (actualAmount / campaign.targetAmount) * 100

      if (percentRaised >= 50 && percentRaised < 90)
        // Do not await  -> send to background
        this.sendAmountReachedNotification(campaign, 50, actualAmount).catch((e) => console.log(e))
      if (percentRaised >= 90 && percentRaised < 100)
        // Do not await  -> send to background
        this.sendAmountReachedNotification(campaign, 90, actualAmount).catch((e) => console.log(e))
      if (percentRaised >= 100)
        // Do not await  -> send to background
        this.sendAmountReachedNotification(campaign, 100, actualAmount).catch((e) => console.log(e))
    }
  }

  async sendAmountReachedNotification(
    campaign: {
      title: string
      startDate: Date | null
      endDate: Date | null
      id: string
      slug: string
      targetAmount: number | null
      state: CampaignState
      notificationLists: NotificationList[]
    },
    percent: 50 | 90 | 100,
    raisedAmount: number,
  ) {
    // Check if such email was sent already
    const wasSent = await this.prisma.emailSentRegistry.findFirst({
      where: { type: EmailType[`raised${percent}`], campaignId: campaign.id },
    })

    if (wasSent) return

    const template = await this.prisma.marketingTemplates.findFirst({
      where: {
        name: `${percent}% Raised`,
      },
    })

    const emailLists = campaign.notificationLists

    if (template && emailLists?.length) {
      const data: SendGridParams['SendNotificationParams'] = {
        template_id: template.id,
        list_ids: [emailLists[0].id],
        subject: NotificationData[`${percent}%`].subject,
        // Allow user to un-subscribe only from this campaign notifications
        campaignid: campaign.id,
        template_data: {
          'campaign.name': campaign?.title,
          'campaign.target-amount': campaign?.targetAmount || 0,
          'campaign.raised-amount': raisedAmount,
          'campaign.start-date': campaign.startDate
            ? DateTime.fromJSDate(campaign.startDate).toFormat('dd-MM-yyyy')
            : '',
          'campaign.end-date': campaign.endDate
            ? DateTime.fromJSDate(campaign.endDate).toFormat('dd-MM-yyyy')
            : '',
          'campaign.link': (
            this.config.get<string>('APP_URL') + `/campaigns/${campaign.slug}`
          ).replace(/(http:\/\/|https:\/\/)/gi, ''),
          'general-unsubscribe': (
            this.config.get<string>('APP_URL') +
            `/notifications/unsubscribe?email={{ insert email }}`
          ).replace(/(http:\/\/|https:\/\/)/gi, ''),
        },
      }

      await this.marketingNotificationsService.provider.sendNotification(data)

      // register email sent
      await this.prisma.emailSentRegistry.create({
        data: {
          email: '',
          type: EmailType[`raised${percent}`],
          dateSent: new Date(),
          campaignId: campaign.id,
        },
      })
    }
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
    campaign: Awaited<ReturnType<CampaignService['getCampaignByIdWithPersonIds']>> | null,
  ): Promise<Campaign | null> {
    const updated = await this.prisma.campaign.update({
      where: { id: id },
      data: updateCampaignDto,
    })

    if (!updated) throw new NotFoundException(`Not found campaign with id: ${id}`)

    // Make old slug redirect to this campaign
    if (
      campaign?.state === CampaignState.active &&
      updated?.state === CampaignState.active &&
      campaign?.slug &&
      updateCampaignDto.slug !== campaign.slug
    ) {
      await this.prisma.slugArchive.upsert({
        where: {
          slug: campaign.slug,
        },
        update: {
          campaignId: id,
        },
        create: {
          slug: campaign.slug,
          campaignId: id,
        },
      })
    }
    // Create a notification list for this campaign when updated to active
    if (
      campaign?.state !== CampaignState.active &&
      updated?.state === CampaignState.active &&
      // No list exists yet
      !campaign?.notificationLists?.length
    )
      try {
        await this.createCampaignNotificationList(updated)

        // Notify for new activated campaign
        //Do not await -> send in background
        this.sendNewCampaignNotification(updated).catch((e) => console.log(e))
      } catch (e) {
        Logger.error('Failed to create notification list', e)
      }

    // Update notification list name with the new campaign name
    if (
      updated?.state === CampaignState.active &&
      campaign?.notificationLists?.length &&
      updated.title !== campaign.notificationLists[0]?.name
    )
      try {
        // Get the list
        const list = campaign?.notificationLists[0]
        if (list) await this.updateCampaignNotificationList(updated, list)
      } catch (e) {
        Logger.error('Failed to update notification list', e)
      }

    return updated
  }

  async createCampaignNotificationList(updated: { title: string; id: string }) {
    // Generate list in the marketing platform
    const listId = await this.marketingNotificationsService.provider.createNewContactList({
      name: updated.title || updated.id,
    })

    const name = updated.title || ''

    // Save the list_id in the DB
    await this.prisma.notificationList.create({
      data: {
        id: listId,
        name: name.slice(0, 99),
        campaignId: updated.id,
      },
    })

    return listId
  }

  async sendNewCampaignNotification(campaign: Campaign) {
    // Send notification for the new activated campaign
    const template = await this.prisma.marketingTemplates.findFirst({
      where: {
        name: 'New Active Campaign',
      },
    })

    // General marketing list
    const mainList = this.config.get('sendgrid.marketingListId')

    if (template) {
      const data: SendGridParams['SendNotificationParams'] = {
        template_id: template.id,
        list_ids: [mainList],
        subject: NotificationData['new-campaign'].subject,
        template_data: {
          'campaign.name': campaign?.title,
          'campaign.target-amount': campaign?.targetAmount || 0,
          'campaign.start-date': campaign.startDate
            ? DateTime.fromJSDate(campaign.startDate).toFormat('dd-MM-yyyy')
            : '',
          'campaign.end-date': campaign.endDate
            ? DateTime.fromJSDate(campaign.endDate).toFormat('dd-MM-yyyy')
            : '',
          'campaign.link': (
            this.config.get<string>('APP_URL') + `/campaigns/${campaign.slug}`
          ).replace(/(http:\/\/|https:\/\/)/gi, ''),
          'campaign.news-link': (
            this.config.get<string>('APP_URL') + `/campaigns/${campaign.slug}/news`
          ).replace(/(http:\/\/|https:\/\/)/gi, ''),
        },
      }

      await this.marketingNotificationsService.provider.sendNotification(data)
    }
  }

  async updateCampaignNotificationList(
    updated: { title: string; id: string },
    list: NotificationList,
  ) {
    // Update list name in the Marketing Platform
    await this.marketingNotificationsService.provider.updateContactList({
      data: { name: updated.title },
      id: list.id,
    })
    // update in DB
    await this.prisma.notificationList.update({
      where: { id: list.id },
      data: {
        name: updated.title,
      },
    })
  }

  async removeCampaign(campaignId: string) {
    return await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { state: CampaignState.deleted },
    })
  }

  async checkCampaignOwner(keycloakId: string, campaignId: string) {
    const person = await this.personService.findOneByKeycloakId(keycloakId)
    if (!person) {
      Logger.warn(`No person record with keycloak ID: ${keycloakId}`)
      throw new UnauthorizedException()
    }

    const campaign = await this.verifyCampaignOwner(campaignId, person.id)
    if (!campaign) {
      throw new UnauthorizedException()
    }
  }

  async listExpenses(slug: string): Promise<Expense[]> {
    return this.prisma.expense.findMany({
      where: { vault: { campaign: { slug: slug } }, deleted: false },
      include: {
        expenseFiles: true,
      },
    })
  }

  async listExpensesApproved(slug: string): Promise<Expense[]> {
    return this.prisma.expense.findMany({
      where: { vault: { campaign: { slug: slug } }, deleted: false, approvedById: { not: null } },
      include: {
        expenseFiles: true,
      },
    })
  }

  private getVaultAndDonationSummaries(campaignId: string, campaignSums: CampaignSummaryDto[]) {
    const csum = campaignSums.find((e) => e.id === campaignId)
    return {
      reachedAmount: csum?.reachedAmount || 0,
      currentAmount: csum?.currentAmount || 0,
      blockedAmount: csum?.blockedAmount || 0,
      withdrawnAmount: csum?.withdrawnAmount || 0,
      donors: csum?.donors || 0,
    }
  }

  async getCampaignNews(campaignId: string) {
    const articles = await this.prisma.campaignNews.findMany({
      where: { campaignId: campaignId, state: CampaignNewsState.published },
      take: 2,
      orderBy: { publishedAt: 'desc' },
      include: {
        newsFiles: {
          where: {
            OR: [
              { role: CampaignFileRole.invoice },
              { role: CampaignFileRole.document },
              { role: CampaignFileRole.gallery },
            ],
          },
          select: {
            id: true,
            filename: true,
            role: true,
          },
        },
      },
    })

    return articles
  }

  async isMembershipCampaign(campaignTypeId: string): Promise<boolean> {
    const campaignType = await this.prisma.campaignType.findUnique({
      where: { id: campaignTypeId },
    })

    return campaignType?.name.toLowerCase() === 'membership'
  }
}
