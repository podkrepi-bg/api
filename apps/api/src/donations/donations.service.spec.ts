import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignService } from '../campaign/campaign.service'
import { ExportService } from '../export/export.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { VaultModule } from '../vault/vault.module'
import { VaultService } from '../vault/vault.service'
import { DonationsService } from './donations.service'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { Currency, DonationType, PaymentStatus } from '@prisma/client'

describe('DonationsService', () => {
  let service: DonationsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [VaultModule, NotificationModule, MarketingNotificationsModule],
      providers: [
        ConfigService,
        CampaignService,
        DonationsService,
        VaultService,
        MockPrismaService,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: jest.fn(),
        },
        PersonService,
        ExportService,
      ],
    }).compile()

    service = module.get<DonationsService>(DonationsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('listDonationsWithWishes', () => {
    const campaignId = '4c3616b0-1284-4b7d-8b89-9098e7ded2c4'
    const createdAt = new Date('2026-01-01T10:00:00.000Z')
    const person = { firstName: 'John', lastName: 'Doe', company: null }
    const wish = { id: 'wish-1', message: 'Stay strong', createdAt }

    const donationWithWish = {
      id: 'donation-1',
      type: DonationType.donation,
      amount: 1000,
      createdAt,
      payment: { currency: Currency.EUR },
      person,
      metadata: null,
      DonationWish: wish,
    }
    const donationWithoutWish = {
      id: 'donation-2',
      type: DonationType.donation,
      amount: 500,
      createdAt,
      payment: { currency: Currency.EUR },
      person: null,
      metadata: null,
      DonationWish: null,
    }

    beforeEach(() => {
      prismaMock.$transaction.mockResolvedValue([[donationWithWish, donationWithoutWish], 2])
    })

    it('should return donations with and without a wish', async () => {
      const result = await service.listDonationsWithWishes(campaignId)

      expect(result).toEqual({
        items: [
          {
            id: 'donation-1',
            type: DonationType.donation,
            amount: 1000,
            createdAt,
            currency: Currency.EUR,
            person,
            metadata: null,
            wish,
          },
          {
            id: 'donation-2',
            type: DonationType.donation,
            amount: 500,
            createdAt,
            currency: Currency.EUR,
            person: null,
            metadata: null,
            wish: null,
          },
        ],
        totalCount: 2,
      })
    })

    it('should scope to the campaign and to successful payments only', async () => {
      await service.listDonationsWithWishes(campaignId)

      const where = {
        targetVault: { campaignId },
        payment: { status: { in: [PaymentStatus.succeeded, PaymentStatus.guaranteed] } },
      }
      expect(prismaMock.donation.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }))
      expect(prismaMock.donation.count).toHaveBeenCalledWith({ where })
    })

    it('should search in wish message, donor name and metadata name', async () => {
      await service.listDonationsWithWishes(campaignId, 'john')

      const contains = { contains: 'john', mode: 'insensitive' }
      expect(prismaMock.donation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { DonationWish: { message: contains } },
              { metadata: { name: contains } },
              { person: { OR: [{ firstName: contains }, { lastName: contains }] } },
            ],
          }),
        }),
      )
    })

    it('should sort and paginate by the given params', async () => {
      await service.listDonationsWithWishes(campaignId, undefined, 'amount', 'asc', 2, 5)

      expect(prismaMock.donation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ amount: 'asc' }, { id: 'asc' }], skip: 10, take: 5 }),
      )
    })

    it('should fall back to createdAt desc on invalid sort params', async () => {
      await service.listDonationsWithWishes(campaignId, undefined, 'person', 'sideways')

      expect(prismaMock.donation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] }),
      )
    })
  })
})
