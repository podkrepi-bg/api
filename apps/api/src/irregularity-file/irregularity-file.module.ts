import { Module } from '@nestjs/common'
import { IrregularityFileService } from './irregularity-file.service'
import { IrregularityFileController } from './irregularity-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { IrregularityService } from '../irregularity/irregularity.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule],
  controllers: [IrregularityFileController],
  providers: [
    IrregularityFileService,
    IrregularityService,
    PrismaService,
    S3Service,
    PersonService,
  ],
})
export class IrregularityFileModule {}
