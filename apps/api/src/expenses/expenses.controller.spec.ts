import { Test, TestingModule } from '@nestjs/testing'
import { ExpensesController } from './expenses.controller'
import { ExpensesService } from './expenses.service'
import { PrismaService } from '../prisma/prisma.service'


describe('ExpensesController', () => {
  let controller: ExpensesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [PrismaService, ExpensesService],
    }).compile()

    controller = module.get<ExpensesController>(ExpensesController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
