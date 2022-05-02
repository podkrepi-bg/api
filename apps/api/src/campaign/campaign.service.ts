import {
  Campaign,
  CampaignState,
  CampaignType,
  Donation,
  DonationStatus,
  DonationType,
  PaymentProvider,
  Person,
  Vault,
} from '.prisma/client'
import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import Stripe from 'stripe'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from '../vault/vault.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'

@Injectable()
export class CampaignService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => VaultService)) private vaultService: VaultService,
    @Inject(forwardRef(() => PersonService)) private personService: PersonService,
  ) {}

  async listCampaigns(): Promise<Campaign[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { state: { in: [CampaignState.active, CampaignState.complete] } },
      include: {
        campaignType: { select: { category: true } },
        beneficiary: { select: { person: true } },
        coordinator: { select: { person: true } },
        vaults: {
          select: {
            donations: { select: { amount: true } },
          },
        },
        campaignFiles: true,
      },
    })

    //TODO: remove this when Prisma starts supporting nested groupbys
    return campaigns.map(this.addReachedAmountAndDonors)
  }

  async listAllCampaigns(): Promise<Campaign[]> {
    return await this.prisma.campaign.findMany({
      include: {
        campaignType: { select: { name: true } },
        beneficiary: { select: { person: { select: { firstName: true, lastName: true } } } },
        coordinator: { select: { person: { select: { firstName: true, lastName: true } } } },
      },
    })
  }

  async getCampaignById(campaignId: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId } })
    if (!campaign) {
      Logger.warn('No campaign record with ID: ' + campaignId)
      throw new NotFoundException('No campaign record with ID: ' + campaignId)
    }
    return campaign
  }

  async getCampaignByIdAndPersonId(campaignId: string, personId: string): Promise<Campaign | null> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, coordinator: { personId } },
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
            person: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        campaignFiles: true,
        vaults: {
          select: {
            donations: { select: { amount: true, personId: true } },
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

  async getDonationsForCampaign(campaignId: string): Promise<Donation[]> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId },
      include: {
        vaults: true,
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
      include: {
        person: { select: { firstName: true, lastName: true } },
      },
    })

    return donations
  }

  async getDonationByIntentId(paymentIntentId: string): Promise<Donation | null> {
    return this.prisma.donation.findFirst({ where: { extPaymentIntentId: paymentIntentId } })
  }

  async createDraftDonation(
    campaign: Campaign,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<Donation> {
    const campaignId = campaign.id
    const { currency } = campaign
    const { amount } = paymentIntent
    Logger.log('[ CreateDraftDonation ]', { campaignId, amount })

    /**
     * Create or connect campaign vault
     */
    const vault = await this.getCampaignVault(campaignId)
    const targetVault = vault
      ? // Connect the existing vault to this donation
        { connect: { id: vault.id } }
      : // Create new vault for the campaign
        { create: { campaignId, currency, amount, name: campaign.title } }

    /**
     * Create donation object
     */
    const donation = await this.prisma.donation.create({
      data: {
        amount,
        currency,
        targetVault,
        provider: PaymentProvider.stripe,
        type: DonationType.donation,
        status: DonationStatus.waiting,
        extCustomerId: this.getCustomerId(paymentIntent),
        extPaymentIntentId: paymentIntent.id,
        extPaymentMethodId: this.getPaymentMehtodId(paymentIntent),
      },
    })

    return donation
  }

  async donateToCampaign(
    campaign: Campaign,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<Donation> {
    const campaignId = campaign.id
    const { amount, customer } = paymentIntent
    Logger.log('[ DonateToCampaign ]', { campaignId, customer, amount })

    const vault = await this.getCampaignVault(campaignId)

    /**
     * Find or create a donation record by payment intent id
     */
    let donation: Donation | null = await this.getDonationByIntentId(paymentIntent.id)
    if (!donation) {
      donation = await this.createDraftDonation(campaign, paymentIntent)
    }

    const person = this.extractPersonFromIntent(paymentIntent)

    /**
     * Update status of donation
     * Connect the donation to a person (by email)
     * Person is created if not found
     */
    await this.prisma.donation.update({
      data: {
        status: DonationStatus.succeeded,
        extCustomerId: this.getCustomerId(paymentIntent),
        extPaymentMethodId: this.getPaymentMehtodId(paymentIntent),
        person: {
          connectOrCreate: {
            create: person,
            where: { email: person.email },
          },
        },
      },
      where: { id: donation.id },
    })

    if (vault) {
      await this.vaultService.incrementVaultAmount(vault.id, amount)
    }

    return donation
  }

  async canAcceptDonations(campaignId: string): Promise<boolean> {
    const campaign = await this.getCampaignById(campaignId)

    const validStates: CampaignState[] = ['active']
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

  private extractPersonFromIntent(
    paymentIntent: Stripe.PaymentIntent,
  ): Pick<Person, 'firstName' | 'lastName' | 'email' | 'stripeCustomerId'> {
    const billingDetails = paymentIntent.charges.data.find(() => true)?.billing_details
    const names = billingDetails?.name?.split(' ')
    return {
      firstName: names?.slice(0, -1).join(' ') ?? '',
      lastName: names?.slice(-1).join(' ') ?? '',
      email: billingDetails?.email ?? paymentIntent.receipt_email ?? '',
      stripeCustomerId: this.getCustomerId(paymentIntent),
    }
  }

  private getCustomerId(paymentIntent: Stripe.PaymentIntent): string | 'none' {
    if (typeof paymentIntent.customer === 'string') {
      return paymentIntent.customer
    }
    return paymentIntent.customer?.id ?? 'none'
  }

  private getPaymentMehtodId(paymentIntent: Stripe.PaymentIntent): string | 'none' {
    if (typeof paymentIntent.payment_method === 'string') {
      return paymentIntent.payment_method
    }
    return paymentIntent.payment_method?.id ?? 'none'
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

    const campaign = await this.getCampaignByIdAndPersonId(campaignId, person.id)
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
