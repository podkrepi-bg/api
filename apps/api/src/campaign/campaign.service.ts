import {
  Campaign,
  CampaignState,
  CampaignType,
  Donation,
  DonationStatus,
  DonationType,
  PaymentProvider,
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

@Injectable()
export class CampaignService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => VaultService)) private vaultService: VaultService,
    @Inject(forwardRef(() => PersonService)) private personService: PersonService,
  ) {}

  async listCampaigns(): Promise<Campaign[]> {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: {
        endDate: 'asc',
      },
      where: { state: { in: [CampaignState.active, CampaignState.complete] } },
      include: {
        campaignType: { select: { category: true } },
        beneficiary: { select: { person: true } },
        coordinator: { select: { person: true } },
        organizer: { select: { person: true } },
        campaignFiles: true,
      },
    })
    const campaignSums = await this.getCampaignSums()

    return campaigns.map(c => this.addVaultSummariess(c, campaignSums))
  }

  async listAllCampaigns(): Promise<Campaign[]> {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: {
        endDate: 'asc',
      },
      include: {
        campaignType: { select: { name: true, slug: true } },
        beneficiary: { select: { person: { select: { firstName: true, lastName: true } } } },
        coordinator: { select: { person: { select: { firstName: true, lastName: true } } } },
        organizer: { select: { person: { select: { firstName: true, lastName: true } } } },
        incomingTransfers: { select: { amount: true } },
        outgoingTransfers: { select: { amount: true } },
      },
    })
    const campaignSums = await this.getCampaignSums()

    return campaigns.map(c => this.addVaultSummariess(c, campaignSums))
  }

  async getCampaignSums(campaignIds?: string[]) {
    if (campaignIds && campaignIds.length > 0) {
      return await this.prisma.$queryRaw<{reached: number, currentamount: number, blockedamount: number, donors: number, id: string}[]>
      `
        SELECT
        SUM(CASE when d.status = 'succeeded' THEN d.amount ELSE 0 END) as reached,
        SUM(v.amount) as currentamount,
        SUM(v."blockedAmount") as blockedamount,
        COUNT(distinct CASE when d.status = 'succeeded' THEN d.id END) as donors,
        v.campaign_id as id
        FROM api.vaults v
        LEFT JOIN api.donations d on d.target_vault_id = v.id
        GROUP BY v.campaign_id
        HAVING v.campaign_id in (${Prisma.join(campaignIds)})
      `
    }

    const campaignSums = await this.prisma.$queryRaw<{reached: number, currentamount: number, blockedamount: number, donors: number, id: string}[]>
    `
      SELECT
      SUM(CASE when d.status = 'succeeded' THEN d.amount ELSE 0 END) as reached,
      SUM(v.amount) as currentamount,
      SUM(v."blockedAmount") as blockedamount,
      COUNT(distinct CASE when d.status = 'succeeded' THEN d.id END) as donors,
      v.campaign_id as id
      FROM api.vaults v
      LEFT JOIN api.donations d on d.target_vault_id = v.id
      GROUP BY v.campaign_id
    `
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

    return this.addVaultSummariess(campaign, campaignSums)
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
            person: { select: { id: true, firstName: true, lastName: true } },
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

    return this.addVaultSummariess(campaign, campaignSums)
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
    Logger.debug('[Stripe webhook] Update donation from state initial to waiting', {
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

    // Find donation by extPaymentIntentId an update if status allows

    const donation = await this.prisma.donation.findUnique({
      where: { extPaymentIntentId: paymentData.paymentIntentId },
      select: { id: true, status: true },
    })

    //if missing create the donation with the incoming status
    if (!donation) {
      Logger.error(
        'No donation exists with extPaymentIntentId: ' +
          paymentData.paymentIntentId +
          ' Creating new donation with status: ' +
          newDonationStatus,
      )
      this.prisma.donation.create({
        data: {
          amount: paymentData.netAmount,
          chargedAmount: paymentData.chargedAmount,
          currency: campaign.currency,
          targetVault: targetVaultData,
          provider: PaymentProvider.stripe,
          type: DonationType.donation,
          status: newDonationStatus,
          extCustomerId: paymentData.stripeCustomerId ?? '',
          extPaymentIntentId: paymentData.paymentIntentId,
          extPaymentMethodId: paymentData.paymentMethodId ?? '',
          billingName: paymentData.billingName,
          billingEmail: paymentData.billingEmail,
        },
      })

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
            billingName: paymentData.billingName,
            billingEmail: paymentData.billingEmail,
          },
        })
      } catch (error) {
        Logger.error(
          `[Stripe webhook] Error wile updating donation with paymentIntentId: ${paymentData.paymentIntentId} in database. Error is: ${error}`,
        )
        throw new InternalServerErrorException(error)
      }
    }
    //donation exists but we need to skip because previous status is from later event than the incoming
    else {
      Logger.error(
        `[Stripe webhook] Skipping update of donation with paymentIntentId: ${paymentData.paymentIntentId}
        and status: ${newDonationStatus} because the event comes after existing donation with status: ${donation.status}`,
      )
    }
  }

  async donateToCampaign(campaign: Campaign, paymentData: PaymentData) {
    Logger.debug('[Stripe webhook] update amounts with successful donation', {
      campaignId: campaign.id,
      paymentIntentId: paymentData.paymentIntentId,
      netAmount: paymentData.netAmount,
      chargedAmount: paymentData.chargedAmount,
    })

    this.updateDonationPayment(campaign, paymentData, DonationStatus.succeeded)

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

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign | null> {
    const result = await this.prisma.campaign.update({
      where: { id: id },
      data: updateCampaignDto,
    })
    if (!result) throw new NotFoundException('Not found')
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

  private addVaultSummariess(campaign: Campaign, campaignSums: { reached: number, currentamount: number, blockedamount: number, donors: number, id: string }[]) {
    const csum = campaignSums.find(e => e.id === campaign.id)
    return {
      ...campaign,
      summary:
      {
        reachedAmount: csum?.reached,
        currentAmount: csum?.currentamount,
        blockedAmount: csum?.blockedamount,
        donors: csum?.donors
      }
    }
  }
}
