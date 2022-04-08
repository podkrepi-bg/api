import { mockReset } from 'jest-mock-extended'
import { NotFoundException } from '@nestjs/common'
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

  it('should create a transfer', async () => {
    const transfer = mockData[0]
    prismaMock.transfer.create.mockResolvedValue(transfer)
    const createDto: CreateTransferDto = { ...transfer }

    const result = await controller.create(createDto)

    expect(result).toEqual(transfer)
    expect(prismaMock.transfer.create).toHaveBeenCalledWith({ data: createDto })
  })

  it('should return undefined when creating a transfer with incorrect data', async () => {
    const transfer = mockData[0]
    const createDto: CreateTransferDto = { ...transfer, sourceCampaignId: 'wrong' }

    const result = await controller.create(createDto)

    expect(result).toEqual(undefined)
    await expect(prismaMock.transfer.create({ data: createDto })).toBe(undefined)
  })

  it('should update a transfer', async () => {
    const transfer = mockData[0]
    const updateDto: UpdateTransferDto = { ...transfer, reason: 'random' }
    prismaMock.transfer.update.mockResolvedValue({ ...transfer, reason: 'random' })

    const result = await controller.update(transfer.id, updateDto)

    expect(result).toEqual({ ...transfer, reason: 'random' })
    expect(prismaMock.transfer.update).toHaveBeenCalledWith({
      where: { id: transfer.id },
      data: updateDto,
    })
  })

  it('should not update a transfer with wrong data', async () => {
    const transfer = mockData[0]
    prismaMock.transfer.update.mockResolvedValue(transfer)
    const updateDto: UpdateTransferDto = { ...transfer, sourceCampaignId: 'wrong' }

    const result = await controller.update(transfer.id, updateDto)

    expect(result).toEqual(transfer)
    expect(result).not.toEqual({ ...transfer, sourceCampaignId: 'wrong' })
    expect(prismaMock.transfer.update).toHaveBeenCalledWith({
      where: { id: transfer.id },
      data: updateDto,
    })
  })

  it('should throw an error when updating a non existing transfer', async () => {
    const transfer = mockData[0]

    await expect(controller.update(transfer.id, transfer)).rejects.toThrow(
      new NotFoundException('Not found'),
    )
    await expect(prismaMock.transfer.update({ where: { id: transfer.id }, data: transfer })).toBe(
      undefined,
    )
  })

  it('should remove 1 transfer', async () => {
    const transfer = mockData[0]
    prismaMock.transfer.delete.mockResolvedValue(transfer)

    const result = await controller.remove(transfer.id)

    expect(result).toEqual(transfer)
    expect(prismaMock.transfer.delete).toHaveBeenCalledWith({ where: { id: transfer.id } })
  })

  it('should throw an error when removing a non existing transfer', async () => {
    const transfer = mockData[0]

    await expect(controller.remove(transfer.id)).rejects.toThrow(new NotFoundException('Not found'))
    await expect(prismaMock.transfer.delete({ where: { id: transfer.id } })).toBe(undefined)
  })
})
