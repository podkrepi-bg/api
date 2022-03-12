import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) { }

  async getDonationsByUser(personId: string) {
    const donations = await this.prisma.donation.findMany({ include: { targetVault: { include: { campaign: true } } }, where: { personId } });
    const total = donations.reduce((acc, current) => {
      acc += current.amount
      return acc
    }, 0);
    return {donations, total}; 
  }
}
