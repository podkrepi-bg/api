import { Test, TestingModule } from '@nestjs/testing'
import { BootcampSimeonService } from './bootcamp-simeon.service'
import { PrismaService } from '../prisma/prisma.service'

describe('BootcampSimeonService', () => {
  let service: BootcampSimeonService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BootcampSimeonService, PrismaService],
    }).compile()

    service = module.get<BootcampSimeonService>(BootcampSimeonService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
