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
    prisma.recurringDonation.findMany.mockResolvedValueOnce([1,2,3])
    const result = await service.findAll()
    expect(result).toBeDefined()
    expect(result).toStrictEqual([1,2,3])
  })

  it('should return a recurring donation by id', async () => {
    prisma.recurringDonation.findUnique.mockResolvedValueOnce(1)
    const result = await service.findOne(1)
    expect(result).toBeDefined()
    expect(result).toStrictEqual(1)
  })

  it('should call stripe cancel service my subscription id', async () => {
    const cancelSubscriptionSpy = jest.spyOn(stripeMock.subscriptions, 'cancel')
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
})
