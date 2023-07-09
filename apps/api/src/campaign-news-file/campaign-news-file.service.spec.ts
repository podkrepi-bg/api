import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { CampaignNewsFileService } from './campaign-news-file.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'

describe('CampaignFileService', () => {
  let service: CampaignNewsFileService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignNewsFileService,
        MockPrismaService,
        S3Service,
        PersonService,
        ConfigService,
      ],
    }).compile()

    service = module.get<CampaignNewsFileService>(CampaignNewsFileService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
