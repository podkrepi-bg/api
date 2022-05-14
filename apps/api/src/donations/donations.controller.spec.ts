import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { NotAcceptableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { Campaign, CampaignState } from '@prisma/client'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { VaultService } from '../vault/vault.service'
import { DonationsController } from './donations.controller'
import { DonationsService } from './donations.service'
import { CreateSessionDto } from './dto/create-session.dto'

describe('DonationsController', () => {
  let controller: DonationsController
  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
  }
  const mockSession = {
    mode: 'payment',
    priceId: 'testPriceId',
    campaignId: 'testCampaignId',
    successUrl: 'http://test.com',
    cancelUrl: 'http://test.com',
  } as CreateSessionDto

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
      ],
    }).compile()

    controller = module.get<DonationsController>(DonationsController)
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
      line_items: [{ price: mockSession.priceId, quantity: 1 }],
      payment_method_types: ['card'],
      payment_intent_data: {
        metadata: {
          campaignId: mockSession.campaignId,
        },
      },
      subscription_data: undefined,
      success_url: mockSession.successUrl,
      cancel_url: mockSession.cancelUrl,
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
      new NotAcceptableException('This campaign cannot accept donations'),
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
})
