import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { PersonController } from './person.controller'
import { PersonService } from './person.service'

describe('PersonController', () => {
  let controller: PersonController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonController],
      providers: [PersonService, MockPrismaService, ConfigService],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          return key === 'sendgrid.apiKey' ? 'SG.test' : 'testUrl'
        }),
      })
      .compile()

    controller = module.get<PersonController>(PersonController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
