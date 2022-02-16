import { Test, TestingModule } from '@nestjs/testing'
import { ExpensesService } from './expenses.service'
import { PrismaService } from '../prisma/prisma.service'

describe('ExpensesService', () => {
  let service: ExpensesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, ExpensesService],
    }).compile()

    service = module.get<ExpensesService>(ExpensesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
