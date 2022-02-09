import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignTypeDto } from './dto/create-campaign-type.dto';
import { UpdateCampaignTypeDto } from './dto/update-campaign-type.dto';

@Injectable()
export class CampaignTypesService {
  constructor(private prisma: PrismaService) { }

  async create(createCampaignTypeDto: CreateCampaignTypeDto) {
    return await this.prisma.campaignType.create({ data: createCampaignTypeDto });
  }

  async findAll() {
    return await this.prisma.campaignType.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.campaignType.findFirst({ where: { id } });
  }

  async update(id: string, updateCampaignTypeDto: UpdateCampaignTypeDto) {
    return await this.prisma.campaignType.update({ where: { id }, data: updateCampaignTypeDto });
  }

  async remove(id: string) {
    return await this.prisma.campaignType.delete({ where: { id } });
  }

  async searchByName(key: string) {
    return (await this.prisma.campaignType.findMany()).filter(x => x.name.toLowerCase().includes(key.toLowerCase()))
  }

  async searchByCategory(key: string) {
    return (await this.prisma.campaignType.findMany()).filter(x => x.parentId?.toLowerCase().includes(key.toLowerCase()))
  }
}
