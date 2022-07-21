import { Test, TestingModule } from '@nestjs/testing'
import { ExpensesController } from './expenses.controller'
import { ExpensesService } from './expenses.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { ExpenseStatus, ExpenseType, Currency } from '@prisma/client'
import { mockReset } from 'jest-mock-extended'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'

const mockData = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    status: ExpenseStatus.pending,
    type: ExpenseType.administrative,
    currency: Currency.BGN,
    amount: 150,
    description: 'noreason',
    vaultId: '00000000-0000-0000-0000-000000000016',
    documentId: '00000000-0000-0000-0000-000000000013',
    approvedBy: null,
    deleted: false,
    approvedById: '00000000-0000-0000-0000-000000000012',
    createdAt: new Date('2022-04-2T09:12:13.511Z'),
    updatedAt: new Date('2022-04-2T09:12:13.511Z'),
  },
]

describe('ExpensesController', () => {
  let controller: ExpensesController

  beforeEach(async () => {
    prismaMock.expense.findMany.mockResolvedValue(mockData)

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [MockPrismaService, ExpensesService],
    }).compile()

    controller = module.get<ExpensesController>(ExpensesController)
  })

  // Reset the mock after each test
  afterEach(() => {
    mockReset(prismaMock)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create and update data', () => {
    it('should create an expense', async () => {
      const expense = mockData[0]
      const vault = {
        id: '00000000-0000-0000-0000-000000000016',
        name: 'vault1',
        currency: Currency.BGN,
        campaignId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 200,
        blockedAmount: 0,
      }
      prismaMock.expense.create.mockResolvedValue(expense)
      prismaMock.vault.update.mockResolvedValue(vault)
      prismaMock.vault.findFirst.mockResolvedValue(vault)
      prismaMock.$transaction.mockResolvedValue([expense, vault])

      const createDto: CreateExpenseDto = { ...expense }

      const result = await controller.create(createDto)

      expect(result).toEqual(expense)
      expect(prismaMock.expense.create).toHaveBeenCalledWith({ data: createDto })
      expect(prismaMock.vault.update).toHaveBeenCalledWith({
        where: { id: '00000000-0000-0000-0000-000000000016' },
        data: { blockedAmount: { increment: 150 } },
      })
    })

    it('should not create an expense with insufficient balance', async () => {
      const expense = mockData[0]
      const vault = {
        id: '00000000-0000-0000-0000-000000000016',
        name: 'vault1',
        currency: Currency.BGN,
        campaignId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 200,
        blockedAmount: 100,
      }
      prismaMock.expense.create.mockResolvedValue(expense)
      prismaMock.vault.update.mockResolvedValue(vault)
      prismaMock.vault.findFirst.mockResolvedValue(vault)
      prismaMock.$transaction.mockResolvedValue([expense, vault])

      const createDto: CreateExpenseDto = { ...expense }

      await expect(controller.create(createDto)).rejects.toThrow()
      expect(prismaMock.expense.create).not.toHaveBeenCalled()
      expect(prismaMock.vault.update).not.toHaveBeenCalled()
    })

    it('should update an expense, when it is approved', async () => {
      const expense = mockData[0]

      const vault = {
        id: '00000000-0000-0000-0000-000000000016',
        name: 'vault1',
        currency: Currency.BGN,
        campaignId: '00000000-0000-0000-0000-000000000015',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 1000,
        blockedAmount: 350,
      }
      prismaMock.vault.findFirst.mockResolvedValue(vault)
      prismaMock.expense.findFirst.mockResolvedValue(expense)
      prismaMock.vault.update.mockResolvedValue(vault)
      prismaMock.expense.update.mockResolvedValue(expense)
      prismaMock.$transaction.mockResolvedValue([expense, vault])

      const updateDto: UpdateExpenseDto = { ...expense, status: ExpenseStatus.approved }

      // act
      const result = await controller.update(expense.id, updateDto)

      // assert
      expect(result).toEqual(expense)
      expect(prismaMock.expense.update).toHaveBeenCalledWith({
        where: { id: expense.id },
        data: updateDto,
      })
      expect(prismaMock.vault.update).toHaveBeenCalledWith({
        where: { id: '00000000-0000-0000-0000-000000000016' },
        data: {
          blockedAmount: { decrement: 150 },
          amount: { decrement: 150 },
        },
      })
    })

    it('should not update a withdrawal, when it is already approved/cancelled', async () => {
      const approvedExpense = {
        ...mockData[0],
        status: ExpenseStatus.approved,
      }
      const cancelledExpense = {
        ...mockData[0],
        status: ExpenseStatus.canceled,
      }
      const vault = {
        id: '00000000-0000-0000-0000-000000000016',
        name: 'vault1',
        currency: Currency.BGN,
        campaignId: '00000000-0000-0000-0000-000000000015',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 1000,
        blockedAmount: 350,
      }
      prismaMock.vault.findFirst.mockResolvedValue(vault)
      prismaMock.expense.findFirst.mockResolvedValueOnce(approvedExpense)
      prismaMock.expense.findFirst.mockResolvedValueOnce(cancelledExpense)

      const updateDto: UpdateExpenseDto = { ...approvedExpense, status: ExpenseStatus.approved }

      // assert
      await expect(controller.update(approvedExpense.id, updateDto)).rejects.toThrow()
      await expect(controller.update(cancelledExpense.id, updateDto)).rejects.toThrow()
      expect(prismaMock.expense.update).not.toHaveBeenCalled()
      expect(prismaMock.vault.update).not.toHaveBeenCalled()
    })

    it('should not update an expense, when its vault is being changed', async () => {
      const expense = mockData[0]

      const vault = {
        id: '00000000-0000-0000-0000-000000000016',
        name: 'vault1',
        currency: Currency.BGN,
        campaignId: '00000000-0000-0000-0000-000000000015',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 1000,
        blockedAmount: 350,
      }
      prismaMock.vault.findFirst.mockResolvedValue(vault)
      prismaMock.expense.findFirst.mockResolvedValueOnce(expense)

      const updateDto: UpdateExpenseDto = {
        ...expense,
        status: ExpenseStatus.approved,
        vaultId: '00000000-0000-0000-0000-000000000020',
      }

      // assert
      await expect(controller.update(expense.id, updateDto)).rejects.toThrow()
      expect(prismaMock.expense.update).not.toHaveBeenCalled()
      expect(prismaMock.vault.update).not.toHaveBeenCalled()
    })
  })
})
