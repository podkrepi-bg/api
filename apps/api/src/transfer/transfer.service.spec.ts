import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { TransferService } from './transfer.service'

describe('TransferService', () => {
  let service: TransferService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransferService, MockPrismaService],
    }).compile()

    service = module.get<TransferService>(TransferService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
