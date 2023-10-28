import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { NotAcceptableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import {
  Campaign,
  CampaignState,
  Currency,
  DonationStatus,
  DonationType,
  PaymentProvider,
  Vault,
} from '@prisma/client'
import { CampaignService } from '../campaign/campaign.service'
import { ExportService } from '../export/export.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { VaultService } from '../vault/vault.service'
import { DonationsController } from './donations.controller'
import { DonationsService } from './donations.service'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { MarketingNotificationsModule } from '../notifications/notifications.module'

describe('DonationsController', () => {
  let controller: DonationsController
  let vaultService: VaultService

  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
    paymentIntents: { retrieve: jest.fn() },
    refunds: { create: jest.fn() },
  }
  stripeMock.checkout.sessions.create.mockResolvedValue({ payment_intent: 'unique-intent' })
  stripeMock.paymentIntents.retrieve.mockResolvedValue({
    payment_intent: 'unique-intent',
    metadata: { campaignId: 'unique-campaign' },
  })

  const mockSession = {
    mode: 'payment',
    amount: 100,
    campaignId: 'testCampaignId',
    successUrl: 'http://test.com',
    cancelUrl: 'http://test.com',
    isAnonymous: true,
  } as CreateSessionDto

  const mockDonation = {
    id: '123',
    provider: PaymentProvider.bank,
    currency: Currency.BGN,
    type: DonationType.donation,
    status: DonationStatus.succeeded,
    amount: 10,
    extCustomerId: 'gosho',
    extPaymentIntentId: 'pm1',
    extPaymentMethodId: 'bank',
    billingEmail: 'gosho1@abv.bg',
    billingName: 'gosho1',
    targetVaultId: '1000',
    chargedAmount: 10.5,
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2022-01-02'),
    personId: '1',
    person: {
      id: '1',
      keycloakId: '00000000-0000-0000-0000-000000000015',
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NotificationModule, MarketingNotificationsModule],
      controllers: [DonationsController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        CampaignService,
        DonationsService,
        VaultService,
        MockPrismaService,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
        PersonService,
        ExportService,
        { provide: CACHE_MANAGER, useValue: {} },
      ],
    }).compile()

    controller = module.get<DonationsController>(DonationsController)
    vaultService = module.get<VaultService>(VaultService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('createCheckoutSession should create stripe session for active campaign', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue({
      allowDonationOnComplete: false,
      state: CampaignState.active,
    } as Campaign)

    await expect(controller.createCheckoutSession(mockSession)).resolves.toBeObject()
    expect(prismaMock.campaign.findFirst).toHaveBeenCalled()
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith({
      mode: mockSession.mode,
      line_items: [
        {
          price_data: {
            currency: undefined,
            product_data: {
              name: undefined,
            },
            unit_amount: 100,
          },
          quantity: 1,
        },
      ],
      payment_method_types: ['card'],
      payment_intent_data: {
        metadata: {
          campaignId: mockSession.campaignId,
          isAnonymous: 'true',
          personId: undefined,
          wish: null,
        },
      },
      subscription_data: undefined,
      success_url: mockSession.successUrl,
      cancel_url: mockSession.cancelUrl,
      customer_email: undefined,
      tax_id_collection: {
        enabled: true,
      },
    })
  })

  it('createCheckoutSession should not create stripe session for completed campaign', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue({
      allowDonationOnComplete: false,
      state: CampaignState.complete,
    } as Campaign)

    await expect(controller.createCheckoutSession(mockSession)).rejects.toThrow(
      new NotAcceptableException('Campaign cannot accept donations in state: complete'),
    )
    expect(prismaMock.campaign.findFirst).toHaveBeenCalled()
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('createCheckoutSession should create stripe session for completed campaign if allowed', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue({
      allowDonationOnComplete: true,
      state: CampaignState.complete,
    } as Campaign)

    await expect(controller.createCheckoutSession(mockSession)).resolves.toBeObject()
    expect(prismaMock.campaign.findFirst).toHaveBeenCalled()
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalled()
  })

  it('should update a donations donor, when it is changed', async () => {
    const updatePaymentDto = {
      type: DonationType.donation,
      amount: 10,
      targetPersonId: '2',
    }

    const existingDonation = { ...mockDonation }
    const existingTargetPerson = {
      id: '2',
      firstName: 'string',
      lastName: 'string',
      email: 'string',
      phone: 'string',
      company: 'string',
      createdAt: new Date('2022-01-01'),
      updatedAt: new Date('2022-01-01'),
      newsletter: false,
      address: 'string',
      birthday: new Date('2002-07-07'),
      emailConfirmed: true,
      personalNumber: 'string',
      keycloakId: '00000000-0000-0000-0000-000000000012',
      stripeCustomerId: 'string',
      picture: 'string',
    }

    jest.spyOn(prismaMock, '$transaction').mockImplementation((callback) => callback(prismaMock))
    const mockedIncrementVaultAmount = jest
      .spyOn(vaultService, 'incrementVaultAmount')
      .mockImplementation()

    prismaMock.donation.findFirst.mockResolvedValueOnce(existingDonation)
    prismaMock.person.findFirst.mockResolvedValueOnce(existingTargetPerson)

    // act
    await controller.update('123', updatePaymentDto)

    // assert
    expect(prismaMock.donation.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: {
        status: existingDonation.status,
        personId: '2',
        updatedAt: existingDonation.updatedAt,
      },
    })
    expect(mockedIncrementVaultAmount).toHaveBeenCalledTimes(0)
  })

  it('should update a donation status, when it is changed', async () => {
    const updatePaymentDto: UpdatePaymentDto = {
      type: DonationType.donation,
      amount: 10,
      status: DonationStatus.succeeded,
      targetPersonId: mockDonation.personId,
      billingEmail: mockDonation.billingEmail,
    }

    const existingTargetPerson = {
      id: mockDonation.personId,
      firstName: 'string',
      lastName: 'string',
      email: mockDonation.billingEmail,
      phone: 'string',
      company: 'string',
      createdAt: new Date('2022-01-01'),
      updatedAt: new Date('2022-01-01'),
      newsletter: false,
      address: 'string',
      birthday: new Date('2002-07-07'),
      emailConfirmed: true,
      personalNumber: 'string',
      keycloakId: '00000000-0000-0000-0000-000000000012',
      stripeCustomerId: 'string',
      picture: 'string',
    }

    const existingDonation = { ...mockDonation, status: DonationStatus.initial }
    const expectedUpdatedDonation = { ...existingDonation, status: DonationStatus.succeeded }

    jest.spyOn(prismaMock, '$transaction').mockImplementation((callback) => callback(prismaMock))

    prismaMock.donation.findFirst.mockResolvedValueOnce(existingDonation)
    prismaMock.person.findFirst.mockResolvedValueOnce(existingTargetPerson)
    prismaMock.donation.update.mockResolvedValueOnce(expectedUpdatedDonation)
    prismaMock.vault.update.mockResolvedValueOnce({ id: '1000', campaignId: '111' } as Vault)

    // act
    await controller.update('123', updatePaymentDto)

    // assert
    expect(prismaMock.donation.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: {
        status: DonationStatus.succeeded,
        personId: updatePaymentDto.targetPersonId,
        billingEmail: updatePaymentDto.billingEmail,
        updatedAt: expectedUpdatedDonation.updatedAt,
      },
    })
    expect(prismaMock.vault.update).toHaveBeenCalledWith({
      where: { id: existingDonation.targetVaultId },
      data: {
        amount: {
          increment: existingDonation.amount,
        },
      },
    })
  })

  it('should request refund for donation', async () => {
    await controller.refundStripePaymet('unique-intent')

    expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith('unique-intent')
    expect(stripeMock.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'unique-intent',
      reason: 'requested_by_customer',
    })
  })
})
