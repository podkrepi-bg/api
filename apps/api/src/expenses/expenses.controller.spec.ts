import { Test, TestingModule } from '@nestjs/testing'
import { ExpensesController } from './expenses.controller'
import { ExpensesService } from './expenses.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'

describe('ExpensesController', () => {
  let controller: ExpensesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [MockPrismaService, ExpensesService],
    }).compile()

    controller = module.get<ExpensesController>(ExpensesController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
