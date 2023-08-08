import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDonationWishDto } from './dto/create-donation-wish.dto'
import { Prisma } from '@prisma/client'

@Injectable()
export class DonationWishService {
  constructor(private prisma: PrismaService) {}
  async create(createDonationWishDto: CreateDonationWishDto) {
    return await this.prisma.donationWish.create({ data: createDonationWishDto })
  }

  async findWishesByCampaignId(
    campaignId?: string,
    minAmount?: number,
    maxAmount?: number,
    from?: Date,
    to?: Date,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    pageIndex?: number,
    pageSize?: number,
  ) {
    const whereClause: Prisma.DonationWishWhereInput = {
      campaignId: campaignId,
      donation: {
        amount: {
          gte: minAmount,
          lte: maxAmount,
        },
      },
      createdAt: {
        gte: from,
        lte: to,
      },
      ...(search && {
        OR: [
          { message: { contains: search, mode: 'insensitive' } },
          {
            person: {
              OR: [
                {
                  firstName: { contains: search, mode: 'insensitive' },
                },
                {
                  lastName: { contains: search, mode: 'insensitive' },
                },
              ],
            },
          },
        ],
      }),
    }

    const donationWishes = this.prisma.donationWish.findMany({
      skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
      take: pageSize ? pageSize : undefined,
      where: whereClause,
      orderBy: [
        sortBy
          ? sortBy == 'amount'
            ? { donation: { amount: sortOrder == 'asc' ? 'asc' : 'desc' } }
            : { [sortBy]: sortOrder ?? 'desc' }
          : { createdAt: 'desc' },
      ],
      include: {
        person: { select: { id: true, firstName: true, lastName: true } },
        donation: { select: { amount: true, currency: true } },
      },
    })

    const rowCount = this.prisma.donationWish.count({ where: whereClause })

    const [items, totalCount] = await this.prisma.$transaction([donationWishes, rowCount])
    return { items: items, totalCount: totalCount }
  }
}
