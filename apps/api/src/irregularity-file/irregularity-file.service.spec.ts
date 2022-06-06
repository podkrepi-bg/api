import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { S3Service } from '../s3/s3.service'
import { IrregularityFileService } from './irregularity-file.service'

describe('IrregularityFileService', () => {
  let service: IrregularityFileService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IrregularityFileService,
        MockPrismaService,
        S3Service,
        PersonService,
        ConfigService,
      ],
    }).compile()

    service = module.get<IrregularityFileService>(IrregularityFileService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
