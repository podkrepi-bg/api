import { Injectable, Logger } from '@nestjs/common'
import { CreateCampaignFileDto } from './dto/create-campaign-file.dto'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'

@Injectable()
export class CampaignFileService {
  constructor(private prisma: PrismaService, private s3: S3Service) {}

  async create(createCampaignFileDto: CreateCampaignFileDto) {
    return 'This action adds a new campaignFile'
  }

  async findAll(campaignId: string) {
    const data = await this.s3.getObject('camphoto_824023566.jpeg')
    Logger.log(data)
    return `This action returns all campaignFile`
  }

  findOne(id: string) {
    return `This action returns a #${id} campaignFile`
  }

  remove(id: string) {
    return `This action removes a #${id} campaignFile`
  }
}
