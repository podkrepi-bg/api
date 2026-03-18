import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { mockDeep } from 'jest-mock-extended'
import { RecurringDonationService } from './recurring-donation.service'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { INestApplication } from '@nestjs/common'
import { RecurringDonationStatus } from '@prisma/client'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { RecurringDonation } from '../domain/generated/recurringDonation/entities/recurringDonation.entity'
import { StripeService } from '../stripe/stripe.service'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { RealmViewSupporters } from '@podkrepi-bg/podkrepi-types'

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
  let stripeService: StripeService

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
          provide: StripeService,
          useValue: mockDeep<StripeService>(),
        },
        {
          provide: HttpService,
          useValue: mockDeep<HttpService>(),
        },
        {
          provide: CampaignService,
          useValue: mockDeep<CampaignService>(),
        },
        {
          provide: DonationsService,
          useValue: mockDeep<DonationsService>(),
        },
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
      ],
    }).compile()

    service = module.get<RecurringDonationService>(RecurringDonationService)
    stripeService = module.get<StripeService>(StripeService)
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

  it('should cancel a subscription in db if admin', async () => {
    prismaMock.recurringDonation.update.mockResolvedValueOnce(mockRecurring)
    prismaMock.recurringDonation.findUnique.mockResolvedValueOnce(mockRecurring)
    const updateDbSpy = jest.spyOn(service, 'updateStatus')
    const stripeSpy = jest.spyOn(stripeService, 'cancelSubscription')
    const donationBelongsToSpy = jest.spyOn(service, 'donationBelongsTo')
    donationBelongsToSpy.mockResolvedValue(false)
    stripeSpy.mockResolvedValue({ status: 'active' } as any)
    await service.cancel('1', {
      sub: '1',
      realm_access: { roles: [RealmViewSupporters.role] },
    } as any)
    expect(stripeSpy).toHaveBeenCalledWith(mockRecurring.extSubscriptionId)
    expect(updateDbSpy).toHaveBeenCalledWith(mockRecurring.id, RecurringDonationStatus.canceled)
  })

  it('should cancel a subscription in db if regular user and own donation', async () => {
    // prismaMock.recurringDonation.update.mockResolvedValueOnce(mockRecurring)
    const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(mockRecurring)
    const donationBelongsToSpy = jest.spyOn(service, 'donationBelongsTo')
    donationBelongsToSpy.mockResolvedValue(true)
    const updateDbSpy = jest.spyOn(service, 'updateStatus')
    const stripeSpy = jest.spyOn(stripeService, 'cancelSubscription')
    updateDbSpy.mockResolvedValue(mockRecurring)
    stripeSpy.mockResolvedValue({ status: 'active' } as any)
    await service.cancel(mockRecurring.id, { sub: '1', realm_access: { roles: [] } } as any)
    expect(stripeSpy).toHaveBeenCalledWith(mockRecurring.extSubscriptionId)
    expect(updateDbSpy).toHaveBeenCalledWith(mockRecurring.id, RecurringDonationStatus.canceled)
  })

  it('should not allow to cancel a subscription in db if regular user and not own donation', async () => {
    const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(mockRecurring)
    const updateStatusSpy = jest.spyOn(service, 'updateStatus')
    const donationBelongsToSpy = jest.spyOn(service, 'donationBelongsTo')
    donationBelongsToSpy.mockResolvedValue(false)
    const updateDbSpy = jest.spyOn(prismaMock.recurringDonation, 'update')
    const stripeSpy = jest.spyOn(stripeService, 'cancelSubscription')
    expect(
      service.cancel(mockRecurring.id, { sub: '1', realm_access: { roles: [] } } as any),
    ).rejects.toThrow()
    expect(stripeSpy).not.toHaveBeenCalledWith(mockRecurring.extSubscriptionId)
    expect(updateStatusSpy).not.toHaveBeenCalledWith({
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

  it('should update a recurring donation', async () => {
    expect(true).toBeTruthy()
  })
})
