import { Test, TestingModule } from '@nestjs/testing'
import { WithdrawStatus, Currency } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { WithdrawalController } from './withdrawal.controller'
import { WithdrawalService } from './withdrawal.service'

const mockData = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    status: WithdrawStatus.initial,
    currency: Currency.BGN,
    amount: 150,
    reason: 'noreason',
    sourceVaultId: '00000000-0000-0000-0000-000000000016',
    sourceCampaignId: '00000000-0000-0000-0000-000000000015',
    bankAccountId: '00000000-0000-0000-0000-000000000014',
    documentId: '00000000-0000-0000-0000-000000000013',
    approvedById: '00000000-0000-0000-0000-000000000012',
    targetDate: null,
    createdAt: null,
    updatedAt: null,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    status: WithdrawStatus.initial,
    currency: Currency.EUR,
    amount: 250,
    reason: 'no-reason',
    sourceVaultId: '00000000-0000-0000-0000-000000000016',
    sourceCampaignId: '00000000-0000-0000-0000-000000000015',
    bankAccountId: '00000000-0000-0000-0000-000000000014',
    documentId: '00000000-0000-0000-0000-000000000013',
    approvedById: '00000000-0000-0000-0000-000000000012',
    targetDate: null,
    createdAt: null,
    updatedAt: null,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    status: WithdrawStatus.initial,
    currency: Currency.USD,
    amount: 350,
    reason: 'reason',
    sourceVaultId: '00000000-0000-0000-0000-000000000016',
    sourceCampaignId: '00000000-0000-0000-0000-000000000015',
    bankAccountId: '00000000-0000-0000-0000-000000000014',
    documentId: '00000000-0000-0000-0000-000000000013',
    approvedById: '00000000-0000-0000-0000-000000000012',
    targetDate: null,
    createdAt: null,
    updatedAt: null,
  },
]
describe('WithdrawalController', () => {
  let controller: WithdrawalController

  const mockWithdrawalService = {
    create: jest.fn((dto) => {
      return {
        id: Date.now(),
        ...dto,
      }
    }),
    findAll: jest.fn().mockReturnValueOnce(mockData),
    update: jest.fn((id, dto) => ({
      id,
      ...dto,
    })),
    findOne: jest.fn((id) => {
      return mockData.find((res) => res.id === id)
    }),
    remove: jest.fn((id) => {
      return mockData.filter((task) => task.id !== id)
    }),
    removeMany: jest.fn((ids) => {
      return mockData.filter((task) => !ids.includes(task.id))
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithdrawalController],
      providers: [WithdrawalService, PrismaService],
    })
      .overrideProvider(WithdrawalService)
      .useValue(mockWithdrawalService)
      .compile()

    controller = module.get<WithdrawalController>(WithdrawalController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all withdrawals', async () => {
      const result = await controller.findAll()
      expect(result).toHaveLength(3)
      expect(result).toEqual(mockData)
      expect(mockWithdrawalService.findAll).toHaveBeenCalled()
    })
    it('should get one withdrawal', async () => {
      const result = controller.findOne('00000000-0000-0000-0000-000000000001')
      const expected = mockData[0]
      expect(result).toEqual(expected)
      expect(mockWithdrawalService.findOne).toHaveBeenCalledWith(
        '00000000-0000-0000-0000-000000000001',
      )
    })
  })

  describe('create and update data', () => {
    it('it should create withdrawal', async () => {
      const result = await controller.create({
        status: WithdrawStatus.initial,
        currency: Currency.USD,
        amount: 350,
        reason: 'reason',
        sourceVaultId: '00000000-0000-0000-0000-000000000016',
        sourceCampaignId: '00000000-0000-0000-0000-000000000015',
        bankAccountId: '00000000-0000-0000-0000-000000000014',
        documentId: '00000000-0000-0000-0000-000000000013',
        approvedById: '00000000-0000-0000-0000-000000000012',
      })
      const expected = {
        id: expect.any(Number),
        status: WithdrawStatus.initial,
        currency: Currency.USD,
        amount: 350,
        reason: 'reason',
        sourceVaultId: '00000000-0000-0000-0000-000000000016',
        sourceCampaignId: '00000000-0000-0000-0000-000000000015',
        bankAccountId: '00000000-0000-0000-0000-000000000014',
        documentId: '00000000-0000-0000-0000-000000000013',
        approvedById: '00000000-0000-0000-0000-000000000012',
      }

      expect(result).toEqual(expected)
      expect(mockWithdrawalService.create).toHaveBeenCalled()
    })

    it('it should update withdrawal', async () => {
      const dto = {
        status: WithdrawStatus.initial,
        currency: Currency.USD,
        amount: 350,
        reason: 'reason',
        sourceVaultId: '00000000-0000-0000-0000-000000000016',
        sourceCampaignId: '00000000-0000-0000-0000-000000000015',
        bankAccountId: '00000000-0000-0000-0000-000000000014',
        documentId: '00000000-0000-0000-0000-000000000013',
        approvedById: '00000000-0000-0000-0000-000000000012',
      }

      expect(await controller.update('1', dto)).toEqual({
        id: '1',
        ...dto,
      })

      expect(mockWithdrawalService.update).toHaveBeenCalledWith('1', dto)
    })
  })

  describe('removeData', () => {
    it('should remove one item', async () => {
      const result = await controller.remove('00000000-0000-0000-0000-000000000001')

      expect(result).toHaveLength(2)
      expect(mockWithdrawalService.remove).toBeCalledWith('00000000-0000-0000-0000-000000000001')
    })

    it('should delete many documents', () => {
      const toDell = [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
      ]
      const result = controller.removeMany(toDell as [string])
      const expected = [
        {
          id: '00000000-0000-0000-0000-000000000003',
          status: WithdrawStatus.initial,
          currency: Currency.USD,
          amount: 350,
          reason: 'reason',
          sourceVaultId: '00000000-0000-0000-0000-000000000016',
          sourceCampaignId: '00000000-0000-0000-0000-000000000015',
          bankAccountId: '00000000-0000-0000-0000-000000000014',
          documentId: '00000000-0000-0000-0000-000000000013',
          approvedById: '00000000-0000-0000-0000-000000000012',
          targetDate: null,
          createdAt: null,
          updatedAt: null,
        },
      ]
      expect(result).toEqual(expected)
      expect(mockWithdrawalService.removeMany).toHaveBeenCalledWith(toDell)
    })
  })
})
