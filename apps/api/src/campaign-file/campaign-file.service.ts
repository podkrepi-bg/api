import { Readable } from 'stream'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CampaignFile, CampaignFileRole, Person } from '@prisma/client'

import { S3Service } from '../s3/s3.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCampaignFileDto } from './dto/create-campaign-file.dto'

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
    const file: CreateCampaignFileDto = {
      filename,
      mimetype,
      role,
      campaignId,
      uploadedById: uploadedBy.id,
    }
    const dbFile = await this.prisma.campaignFile.create({ data: file })

    // Use the DB primary key as the S3 key. This will make sure if is always unique.
    await this.s3.uploadObject(dbFile, mimetype, buf)
    return dbFile.id
  }

  async findOne(id: string): Promise<{
    filename: CampaignFile['filename']
    mimetype: CampaignFile['mimetype']
    stream: Readable
  }> {
    const file = await this.prisma.campaignFile.findFirst({ where: { id: id } })
    if (!file) {
      Logger.warn('No campaign file record with ID: ' + id)
      throw new NotFoundException('No campaign file record with ID: ' + id)
    }
    return {
      filename: file.filename,
      mimetype: file.mimetype,
      stream: await this.s3.streamFile(id),
    }
  }

  async remove(id: string) {
    await this.s3.deleteObject(id)
    return await this.prisma.campaignFile.delete({ where: { id } })
  }
}
