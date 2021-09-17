import { Injectable } from '@nestjs/common'
import { Campaign, CampaignType } from '.prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async listCampaigns(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany()
  }

  async listCampaignTypes(): Promise<CampaignType[]> {
    return this.prisma.campaignType.findMany()
  }

  async createCampaign(inputDto: CreateCampaignDto): Promise<Campaign> {
    return this.prisma.campaign.create({
      data: inputDto.toEntity(),
    })
  }
}
