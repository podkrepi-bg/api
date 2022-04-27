import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { ExpensesService } from './expenses.service'

describe('ExpensesService', () => {
  let service: ExpensesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockPrismaService, ExpensesService],
    }).compile()

    service = module.get<ExpensesService>(ExpensesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
