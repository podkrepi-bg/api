import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { Currency, DonationStatus, DonationType, PaymentProvider } from '@prisma/client'
import { CampaignService } from '../campaign/campaign.service'
import { ExportService } from '../export/export.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { VaultService } from '../vault/vault.service'
import { DonationsController } from './donations.controller'
import { DonationsService } from './donations.service'

describe('DonationsController', () => {
  let controller: DonationsController
  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
  }
  stripeMock.checkout.sessions.create.mockResolvedValue({ payment_intent: 'unique-intent' })
  const vaultMock = {
    incrementVaultAmount: jest.fn(),
  }

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
      imports: [NotificationModule],
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
        {
          provide: VaultService,
          useValue: vaultMock,
        },
        MockPrismaService,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
        PersonService,
        ExportService,
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
      },
    })
    expect(vaultMock.incrementVaultAmount).toHaveBeenCalledTimes(0)
  })

  it('should update a donation status, when it is changed', async () => {
    const updatePaymentDto = {
      type: DonationType.donation,
      amount: 10,
      status: DonationStatus.succeeded,
    }

    const existingDonation = { ...mockDonation, status: DonationStatus.initial }
    const expectedUpdatedDonation = { ...existingDonation, status: DonationStatus.succeeded }

    prismaMock.donation.findFirst.mockResolvedValueOnce(existingDonation)
    prismaMock.donation.update.mockResolvedValueOnce(expectedUpdatedDonation)

    // act
    await controller.update('123', updatePaymentDto)

    // assert
    expect(prismaMock.donation.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: {
        status: DonationStatus.succeeded,
        personId: '1',
      },
    })
    expect(vaultMock.incrementVaultAmount).toHaveBeenCalledWith(
      existingDonation.targetVaultId,
      existingDonation.amount,
    )
  })
})
