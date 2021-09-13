import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { SupportService } from './support.service'

describe('SupportService', () => {
  let service: SupportService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportService, PrismaService],
    }).compile()

    service = module.get<SupportService>(SupportService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
