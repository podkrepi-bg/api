import { Injectable, Logger } from '@nestjs/common'
import { Campaign, CampaignState, CampaignType } from '.prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'

import { NotFoundException } from '@nestjs/common'

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async listCampaigns(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany()
  }

  async getCampaignById(campaignId: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId } })
    if (campaign === null) {
      Logger.warn('No campaign record with ID: ' + campaignId)
      throw new NotFoundException('No campaign record with ID: ' + campaignId)
    }
    return campaign
  }

  async getCampaignBySlug(slug: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findFirst({ where: { slug } })
    if (campaign === null) {
      Logger.warn('No campaign record with slug: ' + slug)
      throw new NotFoundException('No campaign record with slug: ' + slug)
    }
    return campaign
  }

  async listCampaignTypes(): Promise<CampaignType[]> {
    return this.prisma.campaignType.findMany()
  }

  async createCampaign(inputDto: CreateCampaignDto): Promise<Campaign> {
    return this.prisma.campaign.create({
      data: inputDto.toEntity(),
    })
  }

  async donateToCampaign(campaignId: string, amount: number): Promise<Campaign> {
    Logger.log('[ DonateToCampaign ]', { campaignId, amount })
    return await this.prisma.campaign.update({
      data: {
        reachedAmount: {
          increment: amount,
        },
      },
      where: { id: campaignId },
    })
  }

  async canAcceptDonations(campaignId: string): Promise<boolean> {
    const campaign = await this.getCampaignById(campaignId)

    const validStates: CampaignState[] = ['active']
    if (!validStates.includes(campaign.state)) {
      return false
    }

    return true
  }
}
