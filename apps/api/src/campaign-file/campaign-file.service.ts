import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CampaignFileRole, Person } from '@prisma/client'

import { S3Service } from '../s3/s3.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCampaignFileDto } from './dto/create-campaign-file.dto'
import { StreamableFileDto } from '../common/dto/streamable-file.dto'

@Injectable()
export class CampaignFileService {
  private readonly bucketName: string = 'campaign-files'
  constructor(private prisma: PrismaService, private s3: S3Service) {}

  async create(
    role: CampaignFileRole,
    campaignId: string,
    mimetype: string,
    filename: string,
    person: Person,
    buffer: Buffer,
  ): Promise<string> {
    const file: CreateCampaignFileDto = {
      filename,
      mimetype,
      role,
      campaignId,
      personId: person.id,
    }
    const dbFile = await this.prisma.campaignFile.create({ data: file })

    // Use the DB primary key as the S3 key. This will make sure it is always unique.
    await this.s3.uploadObject(
      this.bucketName,
      dbFile.id,
      encodeURIComponent(filename),
      mimetype,
      buffer,
      'Campaign',
      campaignId,
      person.id,
    )

    return dbFile.id
  }

  async findOne(id: string): Promise<StreamableFileDto> {
    const file = await this.prisma.campaignFile.findFirst({ where: { id: id } })
    if (!file) {
      Logger.warn('No campaign file record with ID: ' + id)
      throw new NotFoundException('No campaign file record with ID: ' + id)
    }
    return {
      filename: encodeURIComponent(file.filename),
      mimetype: file.mimetype,
      stream: await this.s3.streamFile(this.bucketName, id),
    }
  }

  async remove(id: string) {
    await this.s3.deleteObject(this.bucketName, id)
    return await this.prisma.campaignFile.delete({ where: { id } })
  }
}
