import { Module } from '@nestjs/common'
import { IrregularityService } from './irregularity.service'
import { IrregularityController } from './irregularity.controller'
import { IrregularityFileService } from '../irregularity-file/irregularity-file.service'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'

@Module({
  controllers: [IrregularityController],
  providers: [IrregularityService, PrismaService, IrregularityFileService, S3Service],
})
export class IrregularityModule {}
