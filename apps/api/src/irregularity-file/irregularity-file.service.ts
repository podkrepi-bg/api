import { Readable } from 'stream'
import { Person, IrregularityFile } from '@prisma/client'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { S3Service } from '../s3/s3.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateIrregularityFileDto } from './dto/create-irregularity-file.dto'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class IrregularityFileService {
  
  constructor(private prisma: PrismaService, private s3: S3Service, private readonly configService: ConfigService) { }
  
  private readonly S3_BUCKET_NAME =  'irregularity-files'
  private readonly bucketName: string = this.configService.get('IRREGULARITY_FILES_BUCKET', this.S3_BUCKET_NAME)

  async create(
    irregularityId: string,
    mimetype: string,
    filename: string,
    uploadedBy: Person,
    buffer: Buffer,
  ): Promise<string> {
    const file: CreateIrregularityFileDto = {
      filename,
      mimetype,
      irregularityId,
      uploaderId: uploadedBy.id,
    }
    const dbFile = await this.prisma.irregularityFile.create({ data: file })

    // Use the DB primary key as the S3 key. This will make sure iт is always unique.
    await this.s3.uploadObject(
      this.bucketName,
      dbFile.id,
      encodeURIComponent(filename),
      mimetype,
      buffer,
      'Irregularity',
      irregularityId,
      uploadedBy.id,
    )

    return dbFile.id
  }

  async findOne(id: string): Promise<{
    filename: IrregularityFile['filename']
    mimetype: IrregularityFile['mimetype']
    stream: Readable
  }> {
    const file = await this.prisma.irregularityFile.findFirst({ where: { id: id } })
    if (!file) {
      Logger.warn('No irregularity file record with ID: ' + id)
      throw new NotFoundException('No irregularity file record with ID: ' + id)
    }
    return {
      filename: encodeURIComponent(file.filename),
      mimetype: file.mimetype,
      stream: await this.s3.streamFile(this.bucketName, id),
    }
  }

  async findMany(irregularityId: string) {
    return await this.prisma.irregularityFile.findMany({
      where: { irregularityId },
      select: { id: true, filename: true },
    })
  }

  async remove(id: string) {
    await this.s3.deleteObject(this.bucketName, id)
    console.log('deleted s3')
    return await this.prisma.irregularityFile.delete({ where: { id } })
  }
}
