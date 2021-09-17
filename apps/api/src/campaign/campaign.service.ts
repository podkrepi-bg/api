import { Campaign, CampaignType } from '.prisma/client'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async listCampaigns(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany()
  }

  async listCampaignTypes(): Promise<CampaignType[]> {
    return this.prisma.campaignType.findMany()
  }
}
