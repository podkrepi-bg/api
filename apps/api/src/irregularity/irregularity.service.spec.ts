import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { IrregularityFileService } from '../irregularity-file/irregularity-file.service'
import { S3Service } from '../s3/s3.service'
import { IrregularityService } from './irregularity.service'
import { ConfigModule } from '@nestjs/config'

describe('IrregularityService', () => {
  let service: IrregularityService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports:[ConfigModule],
      providers: [IrregularityService, MockPrismaService, IrregularityFileService, S3Service],
    }).compile()

    service = module.get<IrregularityService>(IrregularityService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
