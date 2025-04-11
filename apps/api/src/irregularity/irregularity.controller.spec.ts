import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { IrregularityFileService } from '../irregularity-file/irregularity-file.service'
import { S3Service } from '../s3/s3.service'
import { IrregularityController } from './irregularity.controller'
import { IrregularityService } from './irregularity.service'
import { ConfigModule } from '@nestjs/config'

describe('IrregularityController', () => {
  let controller: IrregularityController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports:[ConfigModule],
      controllers: [IrregularityController],
      providers: [IrregularityService, MockPrismaService, IrregularityFileService, S3Service],
    }).compile()

    controller = module.get<IrregularityController>(IrregularityController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
