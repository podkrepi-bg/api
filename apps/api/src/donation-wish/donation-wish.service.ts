import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDonationWishDto } from './dto/create-donation-wish.dto'

@Injectable()
export class DonationWishService {
  constructor(private prisma: PrismaService) {}
  async create(createDonationWishDto: CreateDonationWishDto) {
    return await this.prisma.donationWish.create({ data: createDonationWishDto })
  }

  async findWishesByCampaignId(campaignId: string, pageIndex?: number, pageSize?: number) {
    const donationWishes = this.prisma.donationWish.findMany({
      skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
      take: pageSize ? pageSize : undefined,
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      include: {
        person: { select: { id: true, firstName: true, lastName: true } },
        donation: { select: { amount: true } },
      },
    })

    const rowCount = this.prisma.donationWish.count({ where: { campaignId } })

    const [items, totalCount] = await this.prisma.$transaction([donationWishes, rowCount])
    console.log(items)
    return { items: items, totalCount: totalCount }
  }
}
