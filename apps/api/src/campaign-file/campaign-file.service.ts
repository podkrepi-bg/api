import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { CreateCampaignFileDto } from './dto/create-campaign-file.dto'
import { Readable } from 'stream'
import { CampaignFileRole, Person } from '@prisma/client'

@Injectable()
export class CampaignFileService {
  constructor(private prisma: PrismaService, private s3: S3Service) {}

  async create(
    role: CampaignFileRole,
    campaignId: string,
    mimetype: string,
    filename: string,
    uploadedBy: Person,
    buf: Buffer,
  ): Promise<string> {
    const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId } })
    if (campaign === null) {
      Logger.warn('No campaign record with ID: ' + campaignId)
      throw new NotFoundException('No campaign record with ID: ' + campaignId)
    }

    const file: CreateCampaignFileDto = {
      filename,
      mimetype,
      role,
      campaignId: campaign.id,
      uploadedById: uploadedBy.id,
    }
    const dbFile = await this.prisma.campaignFile.create({ data: file })

    // Use the DB primary key as the S3 key. This will make sure if is always unique.
    await this.s3.uploadObject(dbFile, mimetype, buf)
    return dbFile.id
  }

  async findOne(
    id: string,
  ): Promise<{ filename: string; stream: Readable; mimetype: string | null }> {
    const file = await this.prisma.campaignFile.findFirst({ where: { id: id } })
    if (!file) {
      Logger.warn('No campaign file record with ID: ' + id)
      throw new NotFoundException('No campaign file record with ID: ' + id)
    }
    return {
      filename: file.filename,
      stream: await this.s3.streamFile(id),
      mimetype: file.mimetype,
    }
  }

  async remove(id: string) {
    await this.s3.deleteObject(id)
    return await this.prisma.campaignFile.delete({ where: { id } })
  }
}
