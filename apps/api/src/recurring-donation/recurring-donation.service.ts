import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common'
import { Prisma, RecurringDonation } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { UpdateRecurringDonationDto } from './dto/update-recurring-donation.dto'
import { RecurringDonationStatus } from '@prisma/client'

@Injectable()
export class RecurringDonationService {
  constructor(private prisma: PrismaService) {}

  async create(CreateRecurringDonationDto: CreateRecurringDonationDto): Promise<RecurringDonation> {
    return await this.prisma.recurringDonation.create({
      data: CreateRecurringDonationDto.toEntity(),
    })
  }

  async findAll(): Promise<RecurringDonation[]> {
    return await this.prisma.recurringDonation.findMany()
  }

  static defaultIncludeFields = Prisma.validator<Prisma.RecurringDonationInclude>()({
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
  })

  async findAllWithNames(): Promise<RecurringDonation[]> {
    return await this.prisma.recurringDonation.findMany({
      include: RecurringDonationService.defaultIncludeFields,
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
      include: RecurringDonationService.defaultIncludeFields,
    })
  }

  async donationBelongsTo(id: string, keycloakId: string): Promise<boolean> {
    const count = await this.prisma.recurringDonation.count({
      where: { id, person: { keycloakId } },
    })

    return count > 0
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
    console.log(id)
    const result = await this.prisma.recurringDonation.findUnique({
      where: { id },
      include: RecurringDonationService.defaultIncludeFields,
    })
    console.log(result)
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
        vaultId: updateRecurringDonationDto.sourceVault,
      },
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async cancel(id: string): Promise<RecurringDonation | null> {
    return await this.updateStatus(id, RecurringDonationStatus.canceled)
  }

  async remove(id: string): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.delete({ where: { id: id } })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async findSubscriptionByExtId(extSubscriptionId: string): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.findFirst({
      where: { extSubscriptionId },
      include: RecurringDonationService.defaultIncludeFields,
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
    if (!result) {
      throw new BadRequestException(`Unable to find and update status of ${id} to ${status}`)
    }
    return result
  }
}
