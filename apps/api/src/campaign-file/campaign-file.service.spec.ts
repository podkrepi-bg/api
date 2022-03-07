import { Test, TestingModule } from '@nestjs/testing'
import { CampaignFileService } from './campaign-file.service'
import { S3Service } from '../s3/s3.service'
import { PrismaService } from '../prisma/prisma.service'

describe('CampaignFileService', () => {
  let service: CampaignFileService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignFileService, PrismaService, S3Service],
    }).compile()

    service = module.get<CampaignFileService>(CampaignFileService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
