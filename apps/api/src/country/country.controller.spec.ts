import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CountryController } from './country.controller'
import { CountryService } from './country.service'

describe('CountryController', () => {
  let controller: CountryController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CountryController],
      providers: [CountryService, MockPrismaService],
    }).compile()

    controller = module.get<CountryController>(CountryController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
