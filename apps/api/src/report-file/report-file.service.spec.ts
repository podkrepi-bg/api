import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { S3Service } from '../s3/s3.service'
import { ReportFileService } from './report-file.service'

describe('ReportFileService', () => {
  let service: ReportFileService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportFileService, MockPrismaService, S3Service, PersonService, ConfigService],
    }).compile()

    service = module.get<ReportFileService>(ReportFileService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
