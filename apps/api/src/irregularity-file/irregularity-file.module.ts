import { Module } from '@nestjs/common'
import { IrregularityFileService } from './irregularity-file.service'
import { IrregularityFileController } from './irregularity-file.controller'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { IrregularityService } from '../irregularity/irregularity.service'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [IrregularityFileController],
  providers: [IrregularityFileService, IrregularityService, S3Service, PersonService],
})
export class IrregularityFileModule {}
