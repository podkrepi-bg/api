import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { mockDeep } from 'jest-mock-extended'
import { RecurringDonationService } from './recurring-donation.service'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import Stripe from 'stripe'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { INestApplication } from '@nestjs/common'
import { RecurringDonationStatus } from '@prisma/client'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { RecurringDonation } from '../domain/generated/recurringDonation/entities/recurringDonation.entity'

const mockCreateRecurring = new CreateRecurringDonationDto()
mockCreateRecurring.amount = 1
mockCreateRecurring.currency = 'EUR'
mockCreateRecurring.personId = '1'
mockCreateRecurring.extCustomerId = '1'
mockCreateRecurring.extSubscriptionId = '1'
mockCreateRecurring.sourceVault = '1'
mockCreateRecurring.campaignId = '1'
mockCreateRecurring.status = RecurringDonationStatus.active

const mockRecurring = {
  id: '1',
  vaultId: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  amount: 1,
  currency: 'EUR',
  personId: '1',
  extCustomerId: '1',
  extSubscriptionId: '1',
  campaignId: '1',
  status: RecurringDonationStatus.active,
} as RecurringDonation

describe('RecurringDonationService', () => {
  let service: RecurringDonationService
  let app: INestApplication

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

    app = module.createNestApplication()
    await app.init()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return all recurring donations', async () => {
    prismaMock.recurringDonation.findMany.mockResolvedValue([mockRecurring])
    const result = await service.findAll()
    expect(result).toBeDefined()
    expect(result).toStrictEqual([mockRecurring])
  })

  it('should return a recurring donation by id', async () => {
    prismaMock.recurringDonation.findUnique.mockResolvedValueOnce(mockRecurring)
    const result = await service.findOne('1')
    expect(result).toBeDefined()
    expect(result).toStrictEqual(mockRecurring)
  })

  it('should cancel a subscription in db', async () => {
    prismaMock.recurringDonation.update.mockResolvedValueOnce(mockRecurring)
    await service.cancel('1')
    const updateDbSpy = jest.spyOn(prismaMock.recurringDonation, 'update')
    expect(updateDbSpy).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        status: RecurringDonationStatus.canceled,
      },
    })
  })

  it('should create  a subscription in db', async () => {
    prismaMock.recurringDonation.create.mockResolvedValueOnce(mockRecurring)

    await service.create(mockCreateRecurring)
    const updateDbSpy = jest.spyOn(prismaMock.recurringDonation, 'create')
    expect(updateDbSpy).toHaveBeenCalledWith({
      data: {
        amount: 1,
        currency: 'EUR',
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
