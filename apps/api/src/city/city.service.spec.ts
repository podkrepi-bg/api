import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { CityService } from './city.service'
import { prismaMock } from '../prisma/prisma-client.mock'

describe('CityService', () => {
  let service: CityService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CityService, { provide: PrismaService, useValue: prismaMock}],
    }).compile()

    service = module.get<CityService>(CityService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
