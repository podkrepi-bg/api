import { Test, TestingModule } from '@nestjs/testing'
import { PrismaPromise, Withdrawal, WithdrawStatus, Currency, Prisma } from '@prisma/client'
import { prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { WithdrawalController } from './withdrawal.controller'
import { WithdrawalService } from './withdrawal.service'

describe('WithdrawalController', () => {
  let controller: WithdrawalController
  let prismaService: PrismaService
  let expected: Withdrawal[]
  let expectedOne: Withdrawal

  beforeEach(() => {
    prismaService = prismaMock
    expected = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        status: expect.toBeOneOf(Object.values(WithdrawStatus)),
        currency: expect.toBeOneOf(Object.values(Currency)),
        amount: expect.any(Number),
        reason: expect.any(String),
        sourceVaultId: expect.any(String),
        sourceCampaignId: expect.any(String),
        bankAccountId: expect.any(String),
        documentId: expect.any(String),
        approvedById: expect.any(String),
        targetDate: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        status: expect.toBeOneOf(Object.values(WithdrawStatus)),
        currency: expect.toBeOneOf(Object.values(Currency)),
        amount: expect.any(Number),
        reason: expect.any(String),
        sourceVaultId: expect.any(String),
        sourceCampaignId: expect.any(String),
        bankAccountId: expect.any(String),
        documentId: expect.any(String),
        approvedById: expect.any(String),
        targetDate: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        status: expect.toBeOneOf(Object.values(WithdrawStatus)),
        currency: expect.toBeOneOf(Object.values(Currency)),
        amount: expect.any(Number),
        reason: expect.any(String),
        sourceVaultId: expect.any(String),
        sourceCampaignId: expect.any(String),
        bankAccountId: expect.any(String),
        documentId: expect.any(String),
        approvedById: expect.any(String),
        targetDate: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    ]
    expectedOne = {
      id: '00000000-0000-0000-0000-000000000001',
      status: expect.toBeOneOf(Object.values(WithdrawStatus)),
      currency: expect.toBeOneOf(Object.values(Currency)),
      amount: expect.any(Number),
      reason: expect.any(String),
      sourceVaultId: expect.any(String),
      sourceCampaignId: expect.any(String),
      bankAccountId: expect.any(String),
      documentId: expect.any(String),
      approvedById: expect.any(String),
      targetDate: expect.any(Date),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    }
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithdrawalController],
      providers: [
        WithdrawalService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile()

    controller = module.get<WithdrawalController>(WithdrawalController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all withdrawals in db', async () => {
      const mockList = jest.fn<PrismaPromise<Withdrawal[]>, []>().mockResolvedValue(expected)

      const mockImplementation = jest
        .spyOn(prismaService.withdrawal, 'findMany')
        .mockImplementation(mockList)

      expect(await controller.findAll()).toEqual(expected)
      expect(await controller.findAll()).toHaveLength(3)
      expect(mockImplementation).toBeCalled()
    })
    it('should get one withdrawal', async () => {
      const mockItem = jest.fn<PrismaPromise<Withdrawal>, []>().mockResolvedValue(expectedOne)

      const mockImplementation = jest.spyOn(controller, 'findOne').mockImplementation(mockItem)
      expect(await controller.findOne('00000000-0000-0000-0000-000000000000')).toEqual(expectedOne)
      expect(mockImplementation).toBeCalled()
    })
  })

  describe('create and update data', () => {
    it('it should create withdrawal', async () => {
      const data = {
        id: '00000000-0000-0000-0000-000000000004',
        status: WithdrawStatus.initial,
        currency: Currency.BGN,
        amount: 150,
        reason: 'no-reason',
        sourceVaultId: '00000000-0000-0000-0000-000000000000',
        sourceCampaignId: '00000000-0000-0000-0000-000000000000',
        bankAccountId: '00000000-0000-0000-0000-000000000000',
        documentId: '00000000-0000-0000-0000-000000000000',
        approvedById: '00000000-0000-0000-0000-000000000000',
        targetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockItem = jest.fn<PrismaPromise<Withdrawal>, []>().mockImplementation(() => {
        expected.push(data)
        return data as unknown as PrismaPromise<Withdrawal>
      })

      const mockImplementation = jest.spyOn(controller, 'create').mockImplementation(mockItem)

      expect(await controller.create(data)).toEqual(data)
      expect(expected).toHaveLength(4)
      expect(mockImplementation).toBeCalled()
    })
    it('it should update withdrawal', async () => {
      const data = {
        id: '00000000-0000-0000-0000-000000000001',
        status: WithdrawStatus.succeeded,
        currency: Currency.BGN,
        amount: 150,
        reason: 'no-reason',
        sourceVaultId: '00000000-0000-0000-0000-000000000000',
        sourceCampaignId: '00000000-0000-0000-0000-000000000000',
        bankAccountId: '00000000-0000-0000-0000-000000000000',
        documentId: '00000000-0000-0000-0000-000000000000',
        approvedById: '00000000-0000-0000-0000-000000000000',
        targetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const index = expected.findIndex((x) => x.id == data.id)

      const mockItem = jest.fn<PrismaPromise<Withdrawal>, []>().mockImplementation(() => {
        expected[index] = data
        return data as unknown as PrismaPromise<Withdrawal>
      })

      const mockImplementation = jest.spyOn(controller, 'update').mockImplementation(mockItem)

      expect(await controller.update('00000000-0000-0000-0000-000000000001', data)).toEqual(data)
      expect(expected[index]).toEqual(data)
      expect(mockImplementation).toBeCalled()
    })
  })

  describe('remove', () => {
    it('should remove one item', async () => {
      const itemToDelete = {
        id: '00000000-0000-0000-0000-000000000001',
        status: WithdrawStatus.succeeded,
        currency: Currency.BGN,
        amount: 150,
        reason: 'no-reason',
        sourceVaultId: '00000000-0000-0000-0000-000000000000',
        sourceCampaignId: '00000000-0000-0000-0000-000000000000',
        bankAccountId: '00000000-0000-0000-0000-000000000000',
        documentId: '00000000-0000-0000-0000-000000000000',
        approvedById: '00000000-0000-0000-0000-000000000000',
        targetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockFn = jest.fn<PrismaPromise<Withdrawal>, []>().mockImplementation(() => {
        expected.splice(expected.indexOf(itemToDelete), 1)
        return itemToDelete as unknown as PrismaPromise<Withdrawal>
      })

      const mockImplementation = jest.spyOn(controller, 'remove').mockImplementation(mockFn)

      expect(await controller.remove('00000000-0000-0000-0000-000000000001')).toEqual(itemToDelete)
      expect(expected).toHaveLength(2)
      expect(mockImplementation).toBeCalled()
    })
    it('should remove many items', async () => {
      const idsToDelete = [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
      ]
      const deletedItems: Withdrawal[] = []
      const mockFn = jest.fn<PrismaPromise<Prisma.BatchPayload>, []>().mockImplementation(() => {
        idsToDelete.map((id) => {
          const itemIndex = expected.findIndex((x) => x.id == id)
          deletedItems.push(expected[itemIndex])
          expected.splice(itemIndex, 1)
        })
        return deletedItems.length as unknown as PrismaPromise<Prisma.BatchPayload>
      })

      const mockImplementation = jest
        .spyOn(prismaMock.withdrawal, 'deleteMany')
        .mockImplementation(mockFn)

      expect(await prismaMock.withdrawal.deleteMany()).toEqual(2)
      expect(expected).toHaveLength(1)
      expect(mockImplementation).toBeCalled()
    })
  })
})
