import { Readable } from 'stream'
import { Person, ReportFile } from '@prisma/client'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { S3Service } from '../s3/s3.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReportFileDto } from './dto/create-report-file.dto'

@Injectable()
export class ReportFileService {
  private readonly bucketName: string = 'irregularity-files'

  constructor(private prisma: PrismaService, private s3: S3Service) {}

  async create(
    campaignReportId: string,
    mimetype: string,
    filename: string,
    uploadedBy: Person,
    buffer: Buffer,
  ): Promise<string> {
    const file: CreateReportFileDto = {
      filename,
      mimetype,
      campaignReportId,
      uploadedById: uploadedBy.id,
    }
    const dbFile = await this.prisma.reportFile.create({ data: file })

    // Use the DB primary key as the S3 key. This will make sure iт is always unique.
    await this.s3.uploadObject(
      this.bucketName,
      dbFile.id,
      filename,
      mimetype,
      buffer,
      'Irregularity',
      campaignReportId,
      uploadedBy.id,
    )

    return dbFile.id
  }

  async findOne(id: string): Promise<{
    filename: ReportFile['filename']
    mimetype: ReportFile['mimetype']
    stream: Readable
  }> {
    const file = await this.prisma.reportFile.findFirst({ where: { id: id } })
    if (!file) {
      Logger.warn('No report file record with ID: ' + id)
      throw new NotFoundException('No report file record with ID: ' + id)
    }
    return {
      filename: file.filename,
      mimetype: file.mimetype,
      stream: await this.s3.streamFile(this.bucketName, id),
    }
  }

  async findMany(campaignReportId: string) {
    return await this.prisma.reportFile.findMany({
      where: { campaignReportId },
      select: { id: true, filename: true },
    })
  }

  async remove(id: string) {
    await this.s3.deleteObject(this.bucketName, id)
    console.log('deleted s3')
    return await this.prisma.reportFile.delete({ where: { id } })
  }
}
