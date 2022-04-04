import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { BenefactorService } from './benefactor.service'

describe('BenefactorService', () => {
  let service: BenefactorService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockPrismaService, BenefactorService],
    }).compile()

    service = module.get<BenefactorService>(BenefactorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
