import { Module } from '@nestjs/common'
import { IrregularityService } from './irregularity.service'
import { IrregularityController } from './irregularity.controller'
import { IrregularityFileService } from '../irregularity-file/irregularity-file.service'
import { S3Service } from '../s3/s3.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [IrregularityController],
  providers: [IrregularityService, IrregularityFileService, S3Service],
})
export class IrregularityModule {}
