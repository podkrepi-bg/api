import { Test, TestingModule } from '@nestjs/testing'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignNewsController } from './campaign-news.controller'
import { CampaignNewsService } from './campaign-news.service'

describe('CampaignNewsController', () => {
  let controller: CampaignNewsController

  const personIdMock = 'testPersonId'
  const personServiceMock = {
    findOneByKeycloakId: jest.fn(() => {
      return { id: personIdMock }
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignNewsController],
      providers: [CampaignNewsService, PersonService, MockPrismaService],
    })
      .overrideProvider(PersonService)
      .useValue(personServiceMock)
      .compile()

    controller = module.get<CampaignNewsController>(CampaignNewsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
