import { Module } from '@nestjs/common'
import { IrregularityFileService } from './irregularity-file.service'
import { IrregularityFileController } from './irregularity-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { IrregularityService } from '../irregularity/irregularity.service'
import { ConfigService } from '@nestjs/config'

@Module({
  imports: [ConfigService],
  controllers: [IrregularityFileController],
  providers: [
    IrregularityFileService,
    IrregularityService,
    PrismaService,
    S3Service,
    PersonService,
    ConfigService,
  ],
})
export class IrregularityFileModule {}
