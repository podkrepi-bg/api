import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { CityService } from './city.service'

describe('CityService', () => {
  let service: CityService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CityService, PrismaService],
    }).compile()

    service = module.get<CityService>(CityService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
