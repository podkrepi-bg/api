import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BankTransactionsFile, BankTransactionsFileRole } from '@prisma/client';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CreateBankTransactionsFileDto } from './dto/create-bank-transactions-file.dto';

@Injectable()
export class BankTransactionsFileService {
  constructor(private prisma: PrismaService, private s3: S3Service) {}

  async create(
    role: BankTransactionsFileRole,
    filename: string,
    mimetype: string,
    bankTransactionsFileId : string,
    buf: Buffer,
  ): Promise<string> {
    const file: CreateBankTransactionsFileDto= {
      bankTransactionsFileId,
      mimetype,
      filename,
      role,

    }
    const dbFile = await this.prisma.bankTransactionsFile.create({ data: file })
     // Use the DB primary key as the S3 key. This will make sure if is always unique.

      await this.s3.uploadBankTransactionObject(dbFile, mimetype, buf) // need key from s3 access

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
      stream: await this.s3.streamFile(id),
    }
  }


  async remove(id: string) {
    await this.s3.deleteObject(id)
    return await this.prisma.bankTransactionsFile.delete({ where: { id } })
  }
}
