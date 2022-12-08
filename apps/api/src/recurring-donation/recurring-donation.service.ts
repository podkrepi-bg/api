import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { RecurringDonation } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { UpdateRecurringDonationDto } from './dto/update-recurring-donation.dto'
import { RecurringDonationStatus } from '@prisma/client'

import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { InjectStripeClient } from '@golevelup/nestjs-stripe'
import Stripe from 'stripe'

@Injectable()
export class RecurringDonationService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private httpService: HttpService,
    @InjectStripeClient() private stripeClient: Stripe,
  ) {}

  async create(CreateRecurringDonationDto: CreateRecurringDonationDto): Promise<RecurringDonation> {
    return await this.prisma.recurringDonation.create({
      data: CreateRecurringDonationDto.toEntity(),
    })
  }

  async findAll(): Promise<RecurringDonation[]> {
    return await this.prisma.recurringDonation.findMany()
  }

  static defaultSelectFields = {
    id: true,
    amount: true,
    currency: true,
    status: true,
    extCustomerId: true,
    extSubscriptionId: true,
    vaultId: true,
    personId: true,
    createdAt: true,
    updatedAt: true,
    sourceVault: {
      select: {
        name: true,
        id: true,
        campaign: {
          select: {
            title: true,
            id: true,
          },
        },
      },
    },
    person: {
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    },
  }

  async findAllWithNames(): Promise<RecurringDonation[]> {
    return await this.prisma.recurringDonation.findMany({
      select: RecurringDonationService.defaultSelectFields,
    })
  }

  async findAllActiveRecurringDonationsByCampaignId(campaignId): Promise<RecurringDonation[]> {
    return await this.prisma.recurringDonation.findMany({
      where: {
        status: RecurringDonationStatus.active,
        sourceVault: {
          campaignId: campaignId,
        },
      },
      select: RecurringDonationService.defaultSelectFields,
    })
  }

  async findUserRecurringDonations(keycloakId: string): Promise<RecurringDonation[]> {
    return await this.prisma.recurringDonation.findMany({
      where: { person: { keycloakId } },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        extCustomerId: true,
        extSubscriptionId: true,
        vaultId: true,
        personId: true,
        createdAt: true,
        updatedAt: true,
        sourceVault: {
          select: {
            name: true,
            campaign: {
              select: {
                title: true,
                slug: true,
                id: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })
  }

  async findOne(id: string): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.findUnique({
      where: { id },
      select: RecurringDonationService.defaultSelectFields,
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async update(
    id: string,
    updateRecurringDonationDto: UpdateRecurringDonationDto,
  ): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.update({
      where: { id: id },
      data: {
        personId: updateRecurringDonationDto.personId,
        status: updateRecurringDonationDto.status,
        extSubscriptionId: updateRecurringDonationDto.extSubscriptionId,
        extCustomerId: updateRecurringDonationDto.extCustomerId,
        amount: updateRecurringDonationDto.amount,
        currency: updateRecurringDonationDto.currency,
        vaultId: updateRecurringDonationDto.vaultId,
      },
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async cancel(id: string): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.update({
      where: { id: id },
      data: {
        status: RecurringDonationStatus.canceled,
      },
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async remove(id: string): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.delete({ where: { id: id } })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async findSubscriptionByExtId(extSubscriptionId: string): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.findFirst({
      where: { extSubscriptionId },
      select: RecurringDonationService.defaultSelectFields,
    })
    return result
  }

  async updateStatus(
    id: string,
    status: RecurringDonationStatus,
  ): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.update({
      where: { id: id },
      data: {
        status: status,
      },
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async cancelSubscription(subscriptionId: string) {
    Logger.log(`Canceling subscription with api request to cancel: ${subscriptionId}`)
    this.stripeClient.subscriptions.cancel(subscriptionId)
  }
}
