import { mockReset } from 'jest-mock-extended'
import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'

import { TransferService } from './transfer.service'
import { TransferController } from './transfer.controller'
import { CreateTransferDto } from './dto/create-transfer.dto'
import { UpdateTransferDto } from './dto/update-transfer.dto'

import { TransferStatus, Currency } from '.prisma/client'

const mockData = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    status: TransferStatus.initial,
    currency: Currency.BGN,
    amount: 100,
    reason: 'Test reason',
    targetDate: new Date('2022-10-01T00:00:00.000Z'),
    documentId: '00000000-0000-0000-0000-000000000010',
    approvedById: '00000000-0000-0000-0000-000000000020',
    sourceCampaignId: '00000000-0000-0000-0000-000000000030',
    targetCampaignId: '00000000-0000-0000-0000-000000000031',
    sourceVaultId: '00000000-0000-0000-0000-000000000040',
    targetVaultId: '00000000-0000-0000-0000-000000000041',
    createdAt: new Date(),
    updatedAt: null,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    status: TransferStatus.succeeded,
    currency: Currency.USD,
    amount: 20,
    reason: 'New test reason',
    targetDate: null,
    documentId: null,
    approvedById: '00000000-0000-0000-0000-000000000020',
    sourceCampaignId: '00000000-0000-0000-0000-000000000030',
    targetCampaignId: '00000000-0000-0000-0000-000000000031',
    sourceVaultId: '00000000-0000-0000-0000-000000000040',
    targetVaultId: '00000000-0000-0000-0000-000000000041',
    createdAt: new Date(),
    updatedAt: null,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    status: TransferStatus.incomplete,
    currency: Currency.BGN,
    amount: 300,
    reason: 'Transfer test reason',
    targetDate: new Date('2022-10-15T00:00:00.000Z'),
    documentId: '00000000-0000-0000-0000-000000000011',
    approvedById: null,
    sourceCampaignId: '00000000-0000-0000-0000-000000000032',
    targetCampaignId: '00000000-0000-0000-0000-000000000033',
    sourceVaultId: '00000000-0000-0000-0000-000000000042',
    targetVaultId: '00000000-0000-0000-0000-000000000043',
    createdAt: new Date(),
    updatedAt: null,
  },
]

describe('TransferController', () => {
  let controller: TransferController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [TransferService, MockPrismaService],
    }).compile()

    controller = module.get<TransferController>(TransferController)
  })

  afterEach(() => {
    mockReset(prismaMock)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should list all transfers', async () => {
    prismaMock.transfer.findMany.mockResolvedValue(mockData)

    const result = await controller.findAll()

    expect(result).toHaveLength(3)
    expect(result).toEqual(mockData)
    expect(prismaMock.transfer.findMany).toHaveBeenCalled()
  })

  it('should get 1 transfer', async () => {
    const transfer = mockData[0]
    prismaMock.transfer.findUnique.mockResolvedValue(transfer)

    const result = await controller.findOne(transfer.id)

    expect(result).toEqual(transfer)
    expect(prismaMock.transfer.findUnique).toHaveBeenCalledWith({
      where: { id: transfer.id },
      include: {
        approvedBy: true,
        sourceCampaign: true,
        sourceVault: true,
        targetCampaign: true,
        targetVault: true,
      },
    })
  })

  it('should throw an error if a transfer does not exist', async () => {
    const transfer = mockData[0]

    await expect(controller.findOne(transfer.id)).rejects.toThrow(
      new NotFoundException('Not found'),
    )
    await expect(prismaMock.transfer.findUnique({ where: { id: transfer.id } })).toBe(undefined)
  })

  describe('create and update data', () => {
    it('should create a transfer', async () => {
      const transfer = mockData[0]
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

      prismaMock.transfer.create.mockResolvedValue(transfer)
      prismaMock.vault.update.mockResolvedValue(vault)
      prismaMock.vault.findFirst.mockResolvedValue(vault)
      prismaMock.$transaction.mockResolvedValue([transfer, vault])

      const createDto: CreateTransferDto = { ...transfer }

      const result = await controller.create(createDto)

      expect(result).toEqual(transfer)
      expect(prismaMock.transfer.create).toHaveBeenCalledWith({ data: createDto })
      expect(prismaMock.vault.update).toHaveBeenCalledWith({
        where: { id: '00000000-0000-0000-0000-000000000016' },
        data: { blockedAmount: {"increment": 100} },
      })
    })

    it('should not create a transfer with insufficient balance', async () => {
      const transfer = mockData[0]
      const vault = {
        id: '00000000-0000-0000-0000-000000000016',
        name: 'vault1',
        currency: Currency.BGN,
        campaignId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 200,
        blockedAmount: 150,
      }

      prismaMock.transfer.create.mockResolvedValue(transfer)
      prismaMock.vault.update.mockResolvedValue(vault)
      prismaMock.vault.findFirst.mockResolvedValue(vault)
      prismaMock.$transaction.mockResolvedValue([transfer, vault])

      const createDto: CreateTransferDto = { ...transfer }

      await expect(controller.create(createDto)).rejects.toThrow()
      expect(prismaMock.transfer.create).not.toHaveBeenCalled()
      expect(prismaMock.vault.update).not.toHaveBeenCalled()
    })

    it('should update a transfer, when it is approved', async () => {
      const transfer = mockData[0]
      const srcVault = {
        id: '00000000-0000-0000-0000-000000000016',
        name: 'vault1',
        currency: Currency.BGN,
        campaignId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 200,
        blockedAmount: 100,
      }
      const dstVault = {
        id: '00000000-0000-0000-0000-000000000017',
        name: 'vault2',
        currency: Currency.BGN,
        campaignId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 50,
        blockedAmount: 0,
      }

      prismaMock.transfer.findFirst.mockResolvedValue(transfer)
      prismaMock.vault.findFirst.mockResolvedValueOnce(srcVault)
      prismaMock.vault.findFirst.mockResolvedValueOnce(dstVault)
      prismaMock.transfer.update.mockResolvedValue(transfer)
      prismaMock.vault.update.mockResolvedValueOnce(srcVault)
      prismaMock.vault.update.mockResolvedValueOnce(dstVault)
      prismaMock.$transaction.mockResolvedValue([transfer, srcVault, dstVault])

      const updateDto: UpdateTransferDto = { ...transfer, reason: 'random', status: TransferStatus.succeeded }
      const result = await controller.update(transfer.id, updateDto)

      expect(result).toEqual(transfer)
      expect(prismaMock.transfer.update).toHaveBeenCalledWith({
        where: { id: transfer.id },
        data: updateDto,
      })
      expect(prismaMock.vault.update).toHaveBeenCalledWith({
        where: { id: '00000000-0000-0000-0000-000000000016' },
        data: {
          blockedAmount: {"decrement": 100},
          amount: {"decrement": 100}
        },
      })
      expect(prismaMock.vault.update).toHaveBeenCalledWith({
        where: { id: '00000000-0000-0000-0000-000000000017' },
        data: {
          amount: {"increment": 100}
        },
      })
    })

    it('should update a transfer, when it is declined', async () => {
      const transfer = mockData[0]
      const srcVault = {
        id: '00000000-0000-0000-0000-000000000016',
        name: 'vault1',
        currency: Currency.BGN,
        campaignId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 200,
        blockedAmount: 100,
      }
      const dstVault = {
        id: '00000000-0000-0000-0000-000000000017',
        name: 'vault2',
        currency: Currency.BGN,
        campaignId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 50,
        blockedAmount: 0,
      }

      prismaMock.transfer.findFirst.mockResolvedValue(transfer)
      prismaMock.vault.findFirst.mockResolvedValueOnce(srcVault)
      prismaMock.vault.findFirst.mockResolvedValueOnce(dstVault)
      prismaMock.transfer.update.mockResolvedValue(transfer)
      prismaMock.vault.update.mockResolvedValueOnce(srcVault)
      prismaMock.vault.update.mockResolvedValueOnce(dstVault)
      prismaMock.$transaction.mockResolvedValue([transfer, srcVault, dstVault])

      const updateDto: UpdateTransferDto = { ...transfer, reason: 'random', status: TransferStatus.declined }
      const result = await controller.update(transfer.id, updateDto)

      expect(result).toEqual(transfer)
      expect(prismaMock.transfer.update).toHaveBeenCalledWith({
        where: { id: transfer.id },
        data: updateDto,
      })
      expect(prismaMock.vault.update).toHaveBeenCalledWith({
        where: { id: '00000000-0000-0000-0000-000000000016' },
        data: {
          blockedAmount: {"decrement": 100}
        },
      })
      expect(prismaMock.vault.update).not.toHaveBeenCalledWith({
        where: { id: '00000000-0000-0000-0000-000000000017' },
        data: {
          amount: {"increment": 100}
        },
      })
    })

    it('should not update a transfer, when it is already approved/declined/cancelled', async () => {
      const approvedTransfer = {
        ...mockData[0],
        status: TransferStatus.succeeded
      }
      const declinedTransfer = {
        ...mockData[0],
        status: TransferStatus.declined
      }
      const cancelledTransfer = {
        ...mockData[0],
        status: TransferStatus.cancelled
      }

      const srcVault = {
        id: '00000000-0000-0000-0000-000000000016',
        name: 'vault1',
        currency: Currency.BGN,
        campaignId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 200,
        blockedAmount: 100,
      }
      const dstVault = {
        id: '00000000-0000-0000-0000-000000000017',
        name: 'vault2',
        currency: Currency.BGN,
        campaignId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: 50,
        blockedAmount: 0,
      }
      prismaMock.vault.findFirst.mockResolvedValueOnce(srcVault)
      prismaMock.vault.findFirst.mockResolvedValueOnce(dstVault)
      prismaMock.transfer.findFirst.mockResolvedValueOnce(approvedTransfer)
      prismaMock.transfer.findFirst.mockResolvedValueOnce(declinedTransfer)
      prismaMock.transfer.findFirst.mockResolvedValueOnce(cancelledTransfer)

      const updateDto: UpdateTransferDto = { ...approvedTransfer, reason: 'random', status: TransferStatus.succeeded }

      // assert
      await expect(controller.update(approvedTransfer.id, updateDto)).rejects.toThrow()
      await expect(controller.update(declinedTransfer.id, updateDto)).rejects.toThrow()
      await expect(controller.update(cancelledTransfer.id, updateDto)).rejects.toThrow()
      expect(prismaMock.transfer.update).not.toHaveBeenCalled()
      expect(prismaMock.vault.update).not.toHaveBeenCalled()
    })

    it('should not update a transfer, when its source vault is being changed', async () => {
      const transfer = mockData[0]

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
      prismaMock.transfer.findFirst.mockResolvedValueOnce(transfer)

      const updateDto: UpdateTransferDto = { ...transfer, reason: 'random', status: TransferStatus.succeeded, sourceVaultId: '00000000-0000-0000-0000-000000000020' }

      // assert
      await expect(controller.update(transfer.id, updateDto)).rejects.toThrow()
      expect(prismaMock.transfer.update).not.toHaveBeenCalled()
      expect(prismaMock.vault.update).not.toHaveBeenCalled()
    })
  })

  describe('removeData', () => {
    it('should not remove transfers', async () => {
      const transfer = mockData[0]
      await expect(controller.remove(transfer.id)).rejects.toThrow(new ForbiddenException())
    })
  })
})
