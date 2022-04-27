import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { WithdrawStatus, Currency } from '@prisma/client'
import { mockReset } from 'jest-mock-extended'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto'
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
    targetDate: new Date('2022-04-2T09:12:13.511Z'),
    createdAt: new Date('2022-04-2T09:12:13.511Z'),
    updatedAt: new Date('2022-04-2T09:12:13.511Z'),
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
    targetDate: new Date('2022-04-2T09:12:13.511Z'),
    createdAt: new Date('2022-04-2T09:12:13.511Z'),
    updatedAt: new Date('2022-04-2T09:12:13.511Z'),
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
    targetDate: new Date('2022-04-2T09:12:13.511Z'),
    createdAt: new Date('2022-04-2T09:12:13.511Z'),
    updatedAt: new Date('2022-04-2T09:12:13.511Z'),
  },
]
describe('WithdrawalController', () => {
  let controller: WithdrawalController

  beforeEach(async () => {
    prismaMock.withdrawal.findMany.mockResolvedValue(mockData)

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithdrawalController],
      providers: [WithdrawalService, MockPrismaService],
    }).compile()

    controller = module.get<WithdrawalController>(WithdrawalController)
  })

  // Reset the mock after each test
  afterEach(() => {
    mockReset(prismaMock)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all withdrawals', async () => {
      const result = await controller.findAll()
      expect(result).toHaveLength(3)
      expect(result).toEqual(mockData)
    })
    it('should get one withdrawal', async () => {
      const withdrawal = mockData[0]
      prismaMock.withdrawal.findFirst.mockResolvedValue(withdrawal)

      const result = await controller.findOne(withdrawal.id)
      expect(result).toEqual(withdrawal)
      expect(prismaMock.withdrawal.findFirst).toHaveBeenCalledWith({
        where: { id: withdrawal.id },
        include: { bankAccount: true, approvedBy: true, sourceCampaign: true, sourceVault: true },
      })
    })
  })

  it('should throw error if withdrawal does not exist', async () => {
    const withdrawal = mockData[0]

    await expect(controller.findOne.bind(controller, withdrawal.id)).rejects.toThrow(
      new NotFoundException('No withdrawal record with ID: ' + withdrawal.id),
    )
  })

  describe('create and update data', () => {
    it('should create a withdrawal', async () => {
      const withdrawal = mockData[0]
      prismaMock.withdrawal.create.mockResolvedValue(withdrawal)

      const createDto: CreateWithdrawalDto = {
        status: WithdrawStatus.initial,
        currency: Currency.BGN,
        amount: 150,
        reason: 'noreason',
        sourceVaultId: '00000000-0000-0000-0000-000000000016',
        sourceCampaignId: '00000000-0000-0000-0000-000000000015',
        bankAccountId: '00000000-0000-0000-0000-000000000014',
        documentId: '00000000-0000-0000-0000-000000000013',
        approvedById: '00000000-0000-0000-0000-000000000012',
      }
      const result = await controller.create(createDto)
      expect(result).toEqual(withdrawal)
      expect(prismaMock.withdrawal.create).toHaveBeenCalledWith({ data: createDto })
    })
    it('should update a withdrawal', async () => {
      const withdrawal = mockData[0]
      prismaMock.withdrawal.update.mockResolvedValue(withdrawal)

      const result = await controller.update(withdrawal.id, withdrawal)
      expect(result).toEqual(withdrawal)
      expect(prismaMock.withdrawal.update).toHaveBeenCalledWith({
        where: { id: withdrawal.id },
        data: withdrawal,
      })
    })
  })

  describe('removeData', () => {
    it('should remove 1 withdrawal', async () => {
      const withdrawal = mockData[0]
      prismaMock.withdrawal.delete.mockResolvedValue(withdrawal)
      const result = await controller.remove(withdrawal.id)
      expect(result).toEqual(withdrawal)
      expect(prismaMock.withdrawal.delete).toHaveBeenCalledWith({ where: { id: withdrawal.id } })
    })
  })
})
