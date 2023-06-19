import { Readable } from 'stream'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CampaignFile, CampaignFileRole, Person } from '@prisma/client'

import { S3Service } from '../s3/s3.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCampaignFileDto } from './dto/create-campaign-file.dto'

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
    // Check if the file already exists in the DB
    let dbFile = await this.prisma.campaignFile.findFirst({ where: { role, campaignId, filename } })

    if (!dbFile) {
      // If not, create a new record
      dbFile = await this.prisma.campaignFile.create({ data: file })

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
    }

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
