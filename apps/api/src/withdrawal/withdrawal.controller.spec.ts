import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { WithdrawStatus, Currency } from '@prisma/client'
import { mockReset } from 'jest-mock-extended'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto'
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto'
import { WithdrawalController } from './withdrawal.controller'
import { WithdrawalService } from './withdrawal.service'
import { MarketingNotificationsModule } from '../notifications/notifications.module'

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
      imports: [MarketingNotificationsModule],
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
      prismaMock.withdrawal.create.mockResolvedValue(withdrawal)
      prismaMock.vault.update.mockResolvedValue(vault)
      prismaMock.vault.findFirstOrThrow.mockResolvedValue(vault)
      prismaMock.$transaction.mockResolvedValue([withdrawal, vault])

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
      expect(prismaMock.vault.update).toHaveBeenCalledWith({
        where: { id: '00000000-0000-0000-0000-000000000016' },
        data: { blockedAmount: { increment: 150 } },
      })
    })

    it('should not create a withdrawal with insufficient balance', async () => {
      const withdrawal = mockData[0]
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
      prismaMock.withdrawal.create.mockResolvedValue(withdrawal)
      prismaMock.vault.update.mockResolvedValue(vault)
      prismaMock.vault.findFirst.mockResolvedValue(vault)
      prismaMock.$transaction.mockResolvedValue([withdrawal, vault])

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
      await expect(controller.create(createDto)).rejects.toThrow()
      expect(prismaMock.withdrawal.create).not.toHaveBeenCalled()
      expect(prismaMock.vault.update).not.toHaveBeenCalled()
    })

    it('should update a withdrawal, when it is approved', async () => {
      const withdrawal = mockData[0]

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
      prismaMock.vault.findFirstOrThrow.mockResolvedValue(vault)
      prismaMock.withdrawal.findFirstOrThrow.mockResolvedValue(withdrawal)
      prismaMock.vault.update.mockResolvedValue(vault)
      prismaMock.withdrawal.update.mockResolvedValue(withdrawal)
      prismaMock.$transaction.mockResolvedValue([withdrawal, vault])

      const updateDto: UpdateWithdrawalDto = {
        status: WithdrawStatus.succeeded,
        currency: Currency.BGN,
        amount: 150,
        reason: 'noreason',
        sourceVaultId: '00000000-0000-0000-0000-000000000016',
        sourceCampaignId: '00000000-0000-0000-0000-000000000015',
        bankAccountId: '00000000-0000-0000-0000-000000000014',
        documentId: '00000000-0000-0000-0000-000000000013',
        approvedById: '00000000-0000-0000-0000-000000000012',
      }

      // act
      const result = await controller.update(withdrawal.id, updateDto)

      // assert
      expect(result).toEqual(withdrawal)
      expect(prismaMock.withdrawal.update).toHaveBeenCalledWith({
        where: { id: withdrawal.id },
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

    it('should update a withdrawal, when it is declined', async () => {
      const withdrawal = mockData[0]

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
      prismaMock.vault.findFirstOrThrow.mockResolvedValue(vault)
      prismaMock.withdrawal.findFirstOrThrow.mockResolvedValue(withdrawal)
      prismaMock.vault.update.mockResolvedValue(vault)
      prismaMock.withdrawal.update.mockResolvedValue(withdrawal)
      prismaMock.$transaction.mockResolvedValue([withdrawal, vault])

      const updateDto: UpdateWithdrawalDto = {
        status: WithdrawStatus.declined,
        currency: Currency.BGN,
        amount: 150,
        reason: 'noreason',
        sourceVaultId: '00000000-0000-0000-0000-000000000016',
        sourceCampaignId: '00000000-0000-0000-0000-000000000015',
        bankAccountId: '00000000-0000-0000-0000-000000000014',
        documentId: '00000000-0000-0000-0000-000000000013',
        approvedById: '00000000-0000-0000-0000-000000000012',
      }

      // act
      const result = await controller.update(withdrawal.id, updateDto)

      // assert
      expect(result).toEqual(withdrawal)
      expect(prismaMock.withdrawal.update).toHaveBeenCalledWith({
        where: { id: withdrawal.id },
        data: updateDto,
      })
      expect(prismaMock.vault.update).toHaveBeenCalledWith({
        where: { id: '00000000-0000-0000-0000-000000000016' },
        data: {
          blockedAmount: { decrement: 150 },
        },
      })
    })

    it('should not update a withdrawal, when it is already approved/declined/cancelled', async () => {
      const approvedWithdrawal = {
        ...mockData[0],
        status: WithdrawStatus.succeeded,
      }
      const declinedWithdrawal = {
        ...mockData[0],
        status: WithdrawStatus.declined,
      }
      const cancelledWithdrawal = {
        ...mockData[0],
        status: WithdrawStatus.cancelled,
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
      prismaMock.withdrawal.findFirst.mockResolvedValueOnce(approvedWithdrawal)
      prismaMock.withdrawal.findFirst.mockResolvedValueOnce(declinedWithdrawal)
      prismaMock.withdrawal.findFirst.mockResolvedValueOnce(cancelledWithdrawal)

      const updateDto: UpdateWithdrawalDto = {
        status: WithdrawStatus.succeeded,
        currency: Currency.BGN,
        amount: 150,
        reason: 'noreason',
        sourceVaultId: '00000000-0000-0000-0000-000000000016',
        sourceCampaignId: '00000000-0000-0000-0000-000000000015',
        bankAccountId: '00000000-0000-0000-0000-000000000014',
        documentId: '00000000-0000-0000-0000-000000000013',
        approvedById: '00000000-0000-0000-0000-000000000012',
      }

      // assert
      await expect(controller.update(approvedWithdrawal.id, updateDto)).rejects.toThrow()
      await expect(controller.update(declinedWithdrawal.id, updateDto)).rejects.toThrow()
      await expect(controller.update(cancelledWithdrawal.id, updateDto)).rejects.toThrow()
      expect(prismaMock.withdrawal.update).not.toHaveBeenCalled()
      expect(prismaMock.vault.update).not.toHaveBeenCalled()
    })

    it('should not update a withdrawal, when its vault is being changed', async () => {
      const withdrawal = mockData[0]

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
      prismaMock.withdrawal.findFirst.mockResolvedValueOnce(withdrawal)

      const updateDto: UpdateWithdrawalDto = {
        status: WithdrawStatus.succeeded,
        currency: Currency.BGN,
        amount: 150,
        reason: 'noreason',
        sourceVaultId: '00000000-0000-0000-0000-000000000020', // from xxx16 to xxxx20
        sourceCampaignId: '00000000-0000-0000-0000-000000000015',
        bankAccountId: '00000000-0000-0000-0000-000000000014',
        documentId: '00000000-0000-0000-0000-000000000013',
        approvedById: '00000000-0000-0000-0000-000000000012',
      }

      // assert
      await expect(controller.update(withdrawal.id, updateDto)).rejects.toThrow()
      expect(prismaMock.withdrawal.update).not.toHaveBeenCalled()
      expect(prismaMock.vault.update).not.toHaveBeenCalled()
    })
  })

  describe('removeData', () => {
    it('should not remove withdrawals', async () => {
      const withdrawal = mockData[0]
      await expect(controller.remove(withdrawal.id)).rejects.toThrow(new ForbiddenException())
    })
  })
})
