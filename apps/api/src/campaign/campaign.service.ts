import { Prisma, Campaign, CampaignState, CampaignType, Donation, Vault } from '@prisma/client'
import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from '../vault/vault.service'
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
        state: true,
        slug: true,
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
    return campaign
  }

  async getCampaignByPaymentReference(paymentReference: string): Promise<Campaign | null> {
    return await this.prisma.campaign.findFirst({
      where: { paymentReference: paymentReference },
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

  async donateToCampaign(campaign: Campaign, paymentData: PaymentData) {
    Logger.debug('Update amounts with successful donation', {
      campaignId: campaign.id,
      paymentIntentId: paymentData.paymentIntentId,
      netAmount: paymentData.netAmount,
      chargedAmount: paymentData.chargedAmount,
    })

    const vault = await this.getCampaignVault(campaign.id)
    if (vault) {
      await this.vaultService.incrementVaultAmount(vault.id, paymentData.netAmount)
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

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
    campaign: Partial<Campaign> | null,
  ): Promise<Campaign | null> {
    const result = await this.prisma.campaign.update({
      where: { id: id },
      data: updateCampaignDto,
    })

    if (!result) throw new NotFoundException(`Not found campaign with id: ${id}`)

    // Make old slug redirect to this campaign
    if (
      campaign?.state === CampaignState.active &&
      result?.state === CampaignState.active &&
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

    return result
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
      withdrawnAmount: csum?.withdrawnAmount || 0,
      donors: csum?.donors || 0,
    }
  }
}
