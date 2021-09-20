import { Injectable } from '@nestjs/common'
import { Campaign, CampaignType } from '.prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'

import { NotFoundException } from '@nestjs/common'

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async listCampaigns(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany()
  }

  async getCampaignBySlug(slug: string): Promise<Campaign | null> {
    const campaign = this.prisma.campaign.findFirst({ where: { slug } })
    
    if(campaign === null) {
      console.warn('No campaign record with slug: ' + slug);
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
}
