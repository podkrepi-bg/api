import {
  Campaign,
  CampaignState,
  CampaignType,
  Donation,
  DonationStatus,
  DonationType,
  Vault,
} from '.prisma/client'
import {
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
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'
import { PaymentData } from '../donations/helpers/payment-intent-helpers'
import { getAllowedPreviousStatus } from '../donations/helpers/donation-status-updates'
import { Prisma } from '@prisma/client'
import { CampaignSummaryDto } from './dto/campaign-summary.dto'
import {
  AdminCampaignListItem,
  AdminCampaignListItemSelect,
  CampaignListItem,
  CampaignListItemSelect,
} from './dto/list-campaigns.dto'

@Injectable()
export class CampaignService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => VaultService)) private vaultService: VaultService,
    @Inject(forwardRef(() => PersonService)) private personService: PersonService,
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
      orderBy: {
        endDate: 'asc',
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

    if (campaignIds && campaignIds.length > 0) {
      const result = await this.prisma.$queryRaw<CampaignSummaryDto[]>`
      SELECT
      MAX(d.total)::INTEGER as "reachedAmount",
      SUM(v.amount)::INTEGER as "currentAmount",
      SUM(v."blockedAmount")::INTEGER as "blockedAmount",
      MAX(d.donors)::INTEGER as donors,
      v.campaign_id as id
      FROM api.vaults v
      LEFT join (
          select target_vault_id, sum(amount) as total, count(id) as donors
          from api.donations d
          where status = 'succeeded'
          group by target_vault_id
        ) as d
        on d.target_vault_id = v.id
      GROUP BY v.campaign_id
      HAVING v.campaign_id::TEXT in (${Prisma.join(campaignIds)})
      `
      campaignSums = result || []
    } else {
      const result = await this.prisma.$queryRaw<CampaignSummaryDto[]>`
      SELECT
      MAX(d.total)::INTEGER as "reachedAmount",
      SUM(v.amount)::INTEGER as "currentAmount",
      SUM(v."blockedAmount")::INTEGER as "blockedAmount",
      MAX(d.donors)::INTEGER as donors,
      v.campaign_id as id
      FROM api.vaults v
      LEFT join (
          select target_vault_id, sum(amount) as total, count(id) as donors
          from api.donations d
          where status = 'succeeded'
          group by target_vault_id
        ) as d
        on d.target_vault_id = v.id
      GROUP BY v.campaign_id
      `
      campaignSums = result || []
    }

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

  async getCampaignByIdAndCoordinatorId(
    campaignId: string,
    coordinatorId: string,
  ): Promise<Campaign | null> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, coordinator: { personId: coordinatorId } },
      include: { coordinator: true },
    })
    return campaign
  }

  async getCampaignByIdWithPersonIds(id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: id },
      select: {
        beneficiary: { select: { person: { select: { keycloakId: true } } } },
        coordinator: { select: { person: { select: { keycloakId: true } } } },
        organizer: { select: { person: { select: { keycloakId: true } } } },
      },
    })

    return campaign
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
    const campaign = await this.prisma.campaign.findFirst({
      where: { slug },
      include: {
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
      },
    })

    if (campaign === null) {
      Logger.warn('No campaign record with slug: ' + slug)
      throw new NotFoundException('No campaign record with slug: ' + slug)
    }

    const campaignSums = await this.getCampaignSums([campaign.id])

    campaign['summary'] = this.getVaultAndDonationSummaries(campaign.id, campaignSums)
    return campaign
  }

  async getCampaignByPaymentReference(paymentReference: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { paymentReference: paymentReference },
    })
    if (!campaign) {
      Logger.warn('No campaign record with Payment Reference: ' + paymentReference)
      throw new NotFoundException('No campaign record with Payment Reference: ' + paymentReference)
    }
    return campaign
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

  async updateDonationPayment(
    campaign: Campaign,
    paymentData: PaymentData,
    newDonationStatus: DonationStatus,
  ) {
    const campaignId = campaign.id
    Logger.debug('Update donation to status: ' + newDonationStatus, {
      campaignId,
      paymentIntentId: paymentData.paymentIntentId,
    })

    /**
     * Create or connect campaign vault
     */
    const vault = await this.prisma.vault.findFirst({ where: { campaignId } })
    const targetVaultData = vault
      ? // Connect the existing vault to this donation
        { connect: { id: vault.id } }
      : // Create new vault for the campaign
        { create: { campaignId, currency: campaign.currency, name: campaign.title } }

    // Find donation by extPaymentIntentId and update if status allows

    let donation = await this.prisma.donation.findUnique({
      where: { extPaymentIntentId: paymentData.paymentIntentId },
      select: { id: true, status: true },
    })

    // check for UUID length of personId
    // subscriptions always have a personId
    if (!donation && paymentData.personId && paymentData.personId.length === 36) {
      // search for a subscription donation
      // for subscriptions, we don't have a paymentIntentId
      donation = await this.prisma.donation.findFirst({
        where: {
          status: DonationStatus.initial,
          personId: paymentData.personId,
          chargedAmount: paymentData.chargedAmount,
          extPaymentMethodId: 'subscription',
        },
        select: { id: true, status: true, extPaymentMethodId: true },
      })

      if (donation) {
        donation.status = newDonationStatus
      }

      Logger.debug('Donation found by subscription: ', donation)
    }

    //if missing create the donation with the incoming status
    if (!donation) {
      Logger.debug(
        'No donation exists with extPaymentIntentId: ' +
          paymentData.paymentIntentId +
          ' Creating new donation with status: ' +
          newDonationStatus,
      )

      try {
        await this.prisma.donation.create({
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
            person: { connect: { id: paymentData.personId } },
          },
        })
      } catch (error) {
        Logger.error(
          `Error while creating donation with paymentIntentId: ${paymentData.paymentIntentId} and status: ${newDonationStatus} . Error is: ${error}`,
        )
        throw new InternalServerErrorException(error)
      }

      return
    }
    //donation exists, so check if it is safe to update it
    else if (
      donation?.status === newDonationStatus ||
      donation?.status === getAllowedPreviousStatus(newDonationStatus)
    ) {
      try {
        await this.prisma.donation.update({
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
        })
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

  async donateToCampaign(campaign: Campaign, paymentData: PaymentData) {
    Logger.debug('Update amounts with successful donation', {
      campaignId: campaign.id,
      paymentIntentId: paymentData.paymentIntentId,
      netAmount: paymentData.netAmount,
      chargedAmount: paymentData.chargedAmount,
    })

    await this.updateDonationPayment(campaign, paymentData, DonationStatus.succeeded)

    const vault = await this.getCampaignVault(campaign.id)
    if (vault) {
      await this.vaultService.incrementVaultAmount(vault.id, paymentData.netAmount)
    } else {
      Logger.error('No vault found for campaign: ' + campaign.id)
    }
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
  public async updateCampaignStatusIfTargetReached(campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
      },
      select: {
        vaults: true,
        targetAmount: true,
        id: true,
        state: true,
      },
    })

    if (campaign && campaign.state !== CampaignState.complete && campaign.targetAmount) {
      const actualAmount = campaign.vaults.map((vault) => vault.amount).reduce((a, b) => a + b, 0)
      if (actualAmount >= campaign.targetAmount) {
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

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign | null> {
    const result = await this.prisma.campaign.update({
      where: { id: id },
      data: updateCampaignDto,
    })
    if (!result) throw new NotFoundException(`Not found campaign with id: ${id}`)
    return result
  }

  async removeCampaign(campaignId: string) {
    return await this.prisma.campaign.delete({ where: { id: campaignId } })
  }

  async checkCampaignOwner(keycloakId: string, campaignId: string) {
    const person = await this.personService.findOneByKeycloakId(keycloakId)
    if (!person) {
      Logger.warn(`No person record with keycloak ID: ${keycloakId}`)
      throw new UnauthorizedException()
    }

    const campaign = await this.getCampaignByIdAndCoordinatorId(campaignId, person.id)
    if (!campaign) {
      throw new UnauthorizedException()
    }
  }

  private getVaultAndDonationSummaries(campaignId: string, campaignSums: CampaignSummaryDto[]) {
    const csum = campaignSums.find((e) => e.id === campaignId)
    return {
      reachedAmount: csum?.reachedAmount || 0,
      currentAmount: csum?.currentAmount || 0,
      blockedAmount: csum?.blockedAmount || 0,
      donors: csum?.donors || 0,
    }
  }
}
