import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CompanyService } from './company.service'

describe('CompanyService', () => {
  let service: CompanyService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyService, MockPrismaService],
    }).compile()

    service = module.get<CompanyService>(CompanyService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
