import { Test, TestingModule } from '@nestjs/testing'
import { CampaignFileController } from './campaign-file.controller'
import { CampaignFileService } from './campaign-file.service'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'

describe('CampaignFileController', () => {
  let controller: CampaignFileController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignFileController],
      providers: [CampaignFileService, PrismaService, S3Service],
    }).compile()

    controller = module.get<CampaignFileController>(CampaignFileController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
