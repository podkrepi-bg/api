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
import { PaymentData } from '../donations/events/payment-intent-helpers'

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
        vaults: {
          select: {
            donations: { where: { status: DonationStatus.succeeded }, select: { amount: true } },
          },
        },
        campaignFiles: true,
      },
    })

    //TODO: remove this when Prisma starts supporting nested groupbys
    return campaigns.map(this.addReachedAmountAndDonors)
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
        vaults: {
          select: {
            donations: { where: { status: DonationStatus.succeeded }, select: { amount: true } },
            amount: true,
            blockedAmount: true,
          },
        },
      },
    })
    return campaigns
  }

  async getCampaignById(campaignId: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId },
      include: {
        campaignFiles: true,
        vaults: { select: { donations: { select: { amount: true } }, amount: true } },
        incomingTransfers: { select: { amount: true } },
      },
    })
    if (!campaign) {
      Logger.warn('No campaign record with ID: ' + campaignId)
      throw new NotFoundException('No campaign record with ID: ' + campaignId)
    }
    return campaign
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
        vaults: {
          select: {
            donations: {
              where: { status: DonationStatus.succeeded },
              select: { amount: true, personId: true },
            },
          },
        },
      },
    })

    if (campaign === null) {
      Logger.warn('No campaign record with slug: ' + slug)
      throw new NotFoundException('No campaign record with slug: ' + slug)
    }

    return this.addReachedAmountAndDonors(campaign)
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
    donationStatus: DonationStatus,
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

    /**
     * Update status of donation from initial to waiting
     */
    try {
      await this.prisma.donation.upsert({
        where: { extPaymentIntentId: paymentData.paymentIntentId },
        update: {
          status: donationStatus,
          amount: paymentData.amount,
          extCustomerId: paymentData.stripeCustomerId,
          extPaymentMethodId: paymentData.paymentMethodId,
          billingName: paymentData.billingName,
          billingEmail: paymentData.billingEmail,
        },
        create: {
          amount: paymentData.amount,
          currency: campaign.currency,
          targetVault: targetVaultData,
          provider: PaymentProvider.stripe,
          type: DonationType.donation,
          status: DonationStatus.waiting,
          extCustomerId: paymentData.stripeCustomerId ?? '',
          extPaymentIntentId: paymentData.paymentIntentId,
          extPaymentMethodId: paymentData.paymentMethodId ?? '',
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

  async donateToCampaign(campaign: Campaign, paymentData: PaymentData) {
    Logger.debug('[Stripe webhook] update amounts with successful donation', {
      campaignId: campaign.id,
      paymentIntentId: paymentData.paymentIntentId,
      amount: paymentData.amount,
    })

    this.updateDonationPayment(campaign, paymentData, DonationStatus.succeeded)

    const vault = await this.getCampaignVault(campaign.id)
    if (vault) {
      await this.vaultService.incrementVaultAmount(vault.id, paymentData.amount)
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

  private addReachedAmountAndDonors(
    campaign: Campaign & {
      vaults: { donations: { amount: number; personId?: string | null }[] }[]
    },
  ) {
    let campaignAmountReached = 0
    const donors = new Set<string>()
    let shouldAddDonors = false
    let anonymousDonors = 0

    for (const vault of campaign.vaults) {
      for (const donation of vault.donations) {
        campaignAmountReached += donation.amount

        if (donation.personId !== undefined) {
          shouldAddDonors = true
          if (donation.personId === null) {
            anonymousDonors++
          } else {
            donors.add(donation.personId)
          }
        }
      }
    }

    return {
      ...campaign,
      ...{
        summary: [
          {
            reachedAmount: campaignAmountReached,
            donors: shouldAddDonors ? donors.size + anonymousDonors : undefined,
          },
        ],
        vaults: [],
      },
    }
  }
}
