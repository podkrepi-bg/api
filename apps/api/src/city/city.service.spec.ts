import { Test, TestingModule } from '@nestjs/testing'
import { CityService } from './city.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'

describe('CityService', () => {
  let service: CityService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CityService, MockPrismaService],
    }).compile()

    service = module.get<CityService>(CityService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
