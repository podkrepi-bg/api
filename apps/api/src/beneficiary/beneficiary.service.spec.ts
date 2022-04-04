import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { BeneficiaryService } from './beneficiary.service'

describe('BeneficiaryService', () => {
  let service: BeneficiaryService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BeneficiaryService, MockPrismaService],
    }).compile()

    service = module.get<BeneficiaryService>(BeneficiaryService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
