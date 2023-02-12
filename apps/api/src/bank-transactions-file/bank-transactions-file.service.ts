import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { BankTransactionsFile, BankTransactionsFileType, Person } from '@prisma/client'
import { Readable } from 'stream'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { CreateBankTransactionsFileDto } from './dto/create-bank-transactions-file.dto'

@Injectable()
export class BankTransactionsFileService {
  private readonly bucketName: string = 'banktransactions-files'
  constructor(private prisma: PrismaService, private s3: S3Service) {}

  async create(
    type: BankTransactionsFileType,
    filename: string,
    mimetype: string,
    bankTransactionsFileId: string,
    person: Person,
    buffer: Buffer,
  ): Promise<string> {
    const file: CreateBankTransactionsFileDto = {
      bankTransactionsFileId,
      mimetype,
      filename,
      type,
      personId: person.id,
    }
    const dbFile = await this.prisma.bankTransactionsFile.create({ data: file })
    // Use the DB primary key as the S3 key. This will make sure if is always unique.

    /*await this.s3.uploadObject(
      this.bucketName,
      dbFile.id,
      filename,
      mimetype,
      buffer,
      'BankTransactionsFile',
      bankTransactionsFileId,
      person.id,
    ) // need key from s3 access
    */
    return dbFile.id
  }

  async findAll() {
    const files = await this.prisma.bankTransactionsFile.findMany()
    return files
  }

  async findOne(id: string): Promise<{
    filename: BankTransactionsFile['filename']
    mimetype: BankTransactionsFile['mimetype']
    stream: Readable
  }> {
    const file = await this.prisma.bankTransactionsFile.findFirst({ where: { id: id } })
    if (!file) {
      Logger.warn('No bank trasactions file record with ID: ' + id)
      throw new NotFoundException('No bank trasactions file file record with ID: ' + id)
    }
    return {
      filename: file.filename,
      mimetype: file.mimetype,
      stream: await this.s3.streamFile(this.bucketName, id),
    }
  }

  async remove(id: string) {
    await this.s3.deleteObject(this.bucketName, id)
    return await this.prisma.bankTransactionsFile.delete({ where: { id } })
  }
}
