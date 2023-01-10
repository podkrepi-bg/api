import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { mockDeep } from 'jest-mock-extended'
import { RecurringDonationService } from './recurring-donation.service'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import Stripe from 'stripe'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { INestApplication } from '@nestjs/common'
import { RecurringDonationStatus } from '@prisma/client'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { Observable } from 'rxjs'

describe('RecurringDonationService', () => {
  let service: RecurringDonationService
  let app: INestApplication
  let prisma: MockPrismaService.provide

  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
    subscriptions: { cancel: jest.fn() },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringDonationService,
        MockPrismaService,
        ConfigService,
        {
          provide: HttpService,
          useValue: mockDeep<HttpService>(),
        },
        Stripe,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
      ],
    }).compile()

    service = module.get<RecurringDonationService>(RecurringDonationService)
    prisma = module.get<MockPrismaService.provide>(MockPrismaService.provide)

    app = module.createNestApplication()
    await app.init()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return all recurring donations', async () => {
    prisma.recurringDonation.findMany.mockResolvedValueOnce([1, 2, 3])
    const result = await service.findAll()
    expect(result).toBeDefined()
    expect(result).toStrictEqual([1, 2, 3])
  })

  it('should return a recurring donation by id', async () => {
    prisma.recurringDonation.findUnique.mockResolvedValueOnce(1)
    const result = await service.findOne(1)
    expect(result).toBeDefined()
    expect(result).toStrictEqual(1)
  })

  it('should call stripe cancel service my subscription id', async () => {
    const cancelSubscriptionSpy = jest
      .spyOn(stripeMock.subscriptions, 'cancel')
      .mockImplementation(() => {
        return Promise.resolve({ status: 'canceled' })
      })
    await service.cancelSubscription('sub1')
    expect(cancelSubscriptionSpy).toHaveBeenCalledWith('sub1')
  })

  it('should cancel a subscription in db', async () => {
    prisma.recurringDonation.update.mockResolvedValueOnce(1)
    await service.cancel('1')
    const updateDbSpy = jest.spyOn(prisma.recurringDonation, 'update')
    expect(updateDbSpy).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        status: RecurringDonationStatus.canceled,
      },
    })
  })

  it('should create  a subscription in db', async () => {
    prisma.recurringDonation.create.mockResolvedValueOnce(1)

    const dto: CreateRecurringDonationDto = new CreateRecurringDonationDto()
    dto.amount = 1
    dto.currency = 'USD'
    dto.personId = '1'
    dto.extCustomerId = '1'
    dto.extSubscriptionId = '1'
    dto.vaultId = '1'
    dto.sourceVault = '1'
    dto.campaignId = '1'
    dto.status = RecurringDonationStatus.active

    await service.create(dto)
    const updateDbSpy = jest.spyOn(prisma.recurringDonation, 'create')
    expect(updateDbSpy).toHaveBeenCalledWith({
      data: {
        amount: 1,
        currency: 'USD',
        person: {
          connect: {
            id: '1',
          },
        },
        sourceVault: {
          connect: {
            id: '1',
          },
        },
        extCustomerId: '1',
        extSubscriptionId: '1',
        status: RecurringDonationStatus.active,
      },
    })
  })
})
