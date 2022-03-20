import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { BenefactorService } from './benefactor.service'

describe('BenefactorService', () => {
  let service: BenefactorService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, BenefactorService],
    }).compile()

    service = module.get<BenefactorService>(BenefactorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
