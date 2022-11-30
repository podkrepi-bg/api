import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { RecurringDonation } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { UpdateRecurringDonationDto } from './dto/update-recurring-donation.dto'
import { RecurringDonationStatus } from '@prisma/client'

import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'


@Injectable()
export class RecurringDonationService {
  constructor(private prisma: PrismaService,
              private config : ConfigService,
              private httpService: HttpService) {}

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
              campaign: {
                  select: {
                      title: true,
                      id: true
                  }
                }
              }
          },
        person: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            createdAt: true,
          }
        }
      }

  async findAllWithNames(): Promise<RecurringDonation[]> {
    return await this.prisma.recurringDonation.findMany({
      select: RecurringDonationService.defaultSelectFields
    })
  }

  async findAllRecurringDonationsByCampaignId(campaignId): Promise<RecurringDonation[]> {
    return await this.prisma.recurringDonation.findMany({
      where: {
        status: RecurringDonationStatus.active,
        sourceVault: {
          campaignId: campaignId
        }
      },
      select: RecurringDonationService.defaultSelectFields
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
                      id: true
                  }
                }
              }
          }
      },
      orderBy: [{ createdAt: 'desc' }],
    })
  }

  async findOne(id: string): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.findUnique({
      where: { id },
      select: RecurringDonationService.defaultSelectFields
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
        status: RecurringDonationStatus.canceled
      }
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
      select: RecurringDonationService.defaultSelectFields
    })
    return result
  }

  async updateStatus(id: string, status: RecurringDonationStatus): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.update({
      where: { id: id },
      data: {
        status: status
      }
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  //Use the stripe api to cancel the subscription
  //curl -XDELETE https://api.stripe.com/v1/subscriptions/sub_1M8q5pFIrMXL5nkakqtk4xn9 -H "Authorization: Bearer
  async cancelSubscription(subscriptionId: string) {
    const apiUrl = "https://api.stripe.com/v1/subscriptions/" + subscriptionId
    Logger.log(`Canceling subscription with api request to cancel: ${apiUrl}`)
    this.httpService.axiosRef({
      url: apiUrl,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.config.get('stripe.secretKey', '')}`,
      },
    })
    .catch((e) => {
      Logger.error(`Error trying to cancel subscription ${subscriptionId}. Error is: ${e.message}`, 'Stripe')
      return null
    })
  }
}
