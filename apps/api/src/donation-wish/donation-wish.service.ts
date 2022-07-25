import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDonationWishDto } from './dto/create-donation-wish.dto'

@Injectable()
export class DonationWishService {
  constructor(private prisma: PrismaService) {}
  async create(createDonationWishDto: CreateDonationWishDto) {
    return await this.prisma.donationWish.create({ data: createDonationWishDto })
  }

  async findWishesByCampaignId(campaignId: string) {
    const list = await this.prisma.donationWish.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      include: { person: { select: { id: true, firstName: true, lastName: true } } },
    })
    return list
  }
}
