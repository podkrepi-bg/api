import { Test, TestingModule } from '@nestjs/testing'
import { CampaignFileController } from './campaign-file.controller'
import { CampaignFileService } from './campaign-file.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'

describe('CampaignFileController', () => {
  let controller: CampaignFileController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignFileController],
      providers: [CampaignFileService, MockPrismaService, S3Service, PersonService],
    }).compile()

    controller = module.get<CampaignFileController>(CampaignFileController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
