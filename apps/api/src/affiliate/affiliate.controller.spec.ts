import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { AffiliateService } from './affiliate.service'
import { AffiliateController } from './affiliate.controller'
import { DonationsService } from '../donations/donations.service'
import { PersonService } from '../person/person.service'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { CampaignService } from '../campaign/campaign.service'
import { VaultService } from '../vault/vault.service'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { ExportService } from '../export/export.service'
import { Affiliate, Donation, Prisma, Vault } from '@prisma/client'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common'
import { AffiliateStatusUpdateDto } from './dto/affiliate-status-update.dto'
import * as afCodeGenerator from './utils/affiliateCodeGenerator'
import { CreateAffiliateDonationDto } from './dto/create-affiliate-donation.dto'

type PersonWithPayload = Prisma.PersonGetPayload<{ include: { company: true } }>
type AffiliateWithPayload = Prisma.AffiliateGetPayload<{
  include: { company: { include: { person: true } }; donations: true }
}>

describe('AffiliateController', () => {
  let controller: AffiliateController
  let service: AffiliateService
  let donationService: DonationsService
  const affiliateCodeMock = 'af_12345'
  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NotificationModule, MarketingNotificationsModule],
      controllers: [AffiliateController],
      providers: [
        AffiliateService,
        MockPrismaService,
        DonationsService,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        PersonService,
        CampaignService,
        VaultService,
        ExportService,
      ],
    }).compile()

    controller = module.get<AffiliateController>(AffiliateController)
    service = module.get<AffiliateService>(AffiliateService)
    donationService = module.get<DonationsService>(DonationsService)
  })

  const affiliateUpdateDto: AffiliateStatusUpdateDto = {
    newStatus: 'active',
  }

  const mockIndividualProfile: PersonWithPayload = {
    id: 'e43348aa-be33-4c12-80bf-2adfbf8736cd',
    firstName: 'Admin',
    lastName: 'Dev',
    companyId: null,
    keycloakId: '123',
    email: 'test@podkrepi.bg',
    emailConfirmed: false,
    phone: null,
    picture: null,
    createdAt: new Date('2021-10-07T13:38:11.097Z'),
    updatedAt: new Date('2021-10-07T13:38:11.097Z'),
    newsletter: false,
    address: null,
    birthday: null,
    personalNumber: null,
    stripeCustomerId: null,
    company: null,
  }

  const vaultMock: Vault = {
    id: 'vault-id',
    currency: 'BGN',
    amount: 0,
    blockedAmount: 0,
    campaignId: 'campaign-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'vault-name',
  }
  const affiliateMock: Affiliate = {
    id: '1234567',
    companyId: '1234572',
    affiliateCode: null,
    status: 'pending',
  }
  const activeAffiliateMock: AffiliateWithPayload = {
    ...affiliateMock,
    status: 'active',
    id: '12345',
    affiliateCode: affiliateCodeMock,
    company: {
      id: '12345675',
      companyName: 'Podkrepi BG Association',
      companyNumber: '123456789',
      legalPersonName: 'John Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      personId: mockIndividualProfile.id,
      cityId: null,
      countryCode: null,
      person: { ...mockIndividualProfile },
    },
    donations: [],
  }

  const donationResponseMock: Donation = {
    id: 'donation-id',
    type: 'donation',
    status: 'guaranteed',
    amount: 5000,
    affiliateId: activeAffiliateMock.id,
    personId: null,
    extCustomerId: '',
    extPaymentIntentId: '123456',
    extPaymentMethodId: '1234',
    billingEmail: 'test@podkrepi.bg',
    billingName: 'John doe',
    targetVaultId: vaultMock.id,
    chargedAmount: 0,
    currency: 'BGN',
    createdAt: new Date(),
    updatedAt: new Date(),
    provider: 'bank',
  }

  const userMock = {
    sub: 'testKeycloackId',
    'allowed-origins': [],
  } as KeycloakTokenParsed

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('Join program request', () => {
    it('should throw error if request is from individual profile', async () => {
      const createAffiliateSpy = jest.spyOn(service, 'create')
      jest.spyOn(prismaMock.person, 'findFirst').mockResolvedValue(mockIndividualProfile)
      expect(controller.joinAffiliateProgramRequest(userMock)).rejects.toThrow(
        new BadRequestException('Must be corporate profile'),
      )
      expect(createAffiliateSpy).not.toHaveBeenCalled()
    })

    it('should pass if request is coming from corporate profile', async () => {
      const mockCorporateProfile = {
        ...mockIndividualProfile,
        company: {
          id: '123',
          companyName: 'Association Podkrepibg',
          companyNumber: '1234',
          legalPersonName: 'Podkrepibg Test',
          createdAt: new Date(),
          updatedAt: new Date(),
          personId: 'e43348aa-be33-4c12-80bf-2adfbf8736cd',
          cityId: null,
          countryCode: null,
        },
      }
      const createAffiliateSpy = jest.spyOn(service, 'create').mockResolvedValue(affiliateMock)
      jest.spyOn(prismaMock.person, 'findFirst').mockResolvedValue(mockCorporateProfile)

      expect(await controller.joinAffiliateProgramRequest(userMock)).toEqual(affiliateMock)
      expect(createAffiliateSpy).toHaveBeenCalled()
      expect(createAffiliateSpy).toHaveBeenCalledWith(mockCorporateProfile.company.id)
    })
  })

  describe('Update affiliate status', () => {
    it('should throw error if request is not coming from admin', async () => {
      const affiliateSpy = jest.spyOn(service, 'findOneById')
      const updateStatusSpy = jest.spyOn(service, 'updateStatus')
      expect(
        controller.updateAffiliateStatus(affiliateMock.id, affiliateUpdateDto, userMock),
      ).rejects.toThrow(new ForbiddenException('Must be an admin'))
      expect(affiliateSpy).not.toHaveBeenCalled()
      expect(updateStatusSpy).not.toHaveBeenCalled()
    })
    it('should generate affiliate code if status is changed to active', async () => {
      const adminMock: KeycloakTokenParsed = {
        ...userMock,
        resource_access: { account: { roles: ['manage-account', 'account-view-supporters'] } },
      }
      jest.spyOn(service, 'findOneById').mockResolvedValue(affiliateMock)

      const codeGenerationSpy = jest
        .spyOn(afCodeGenerator, 'affiliateCodeGenerator')
        .mockReturnValue(affiliateCodeMock)
      const updateStatusMock = jest.spyOn(service, 'updateStatus')

      await controller.updateAffiliateStatus(affiliateMock.id, affiliateUpdateDto, adminMock)

      expect(codeGenerationSpy).toHaveBeenCalled()
      expect(updateStatusMock).toHaveBeenCalledWith(
        affiliateMock.id,
        affiliateUpdateDto.newStatus,
        affiliateCodeMock,
      )
    })

    it('affiliateCode should be null if newStatus is not active', async () => {
      const adminMock: KeycloakTokenParsed = {
        ...userMock,
        resource_access: { account: { roles: ['manage-account', 'account-view-supporters'] } },
      }

      const activeAffiliateMock: Affiliate = {
        ...affiliateMock,
        status: 'active',
        id: '12345',
        affiliateCode: affiliateCodeMock,
      }

      const mockCancelledStatus: AffiliateStatusUpdateDto = {
        newStatus: 'cancelled',
      }
      jest.spyOn(service, 'findOneById').mockResolvedValue(activeAffiliateMock)

      const codeGenerationSpy = jest
        .spyOn(afCodeGenerator, 'affiliateCodeGenerator')
        .mockReturnValue(affiliateCodeMock)
      const updateStatusSpy = jest.spyOn(service, 'updateStatus')

      await controller.updateAffiliateStatus(activeAffiliateMock.id, mockCancelledStatus, adminMock)

      expect(codeGenerationSpy).not.toHaveBeenCalled()
      expect(updateStatusSpy).toHaveBeenCalledWith(
        activeAffiliateMock.id,
        mockCancelledStatus.newStatus,
        null,
      )
    })
    it('affiliateCode should be null if newStatus is not active', async () => {
      const adminMock: KeycloakTokenParsed = {
        ...userMock,
        resource_access: { account: { roles: ['manage-account', 'account-view-supporters'] } },
      }

      jest.spyOn(service, 'findOneById').mockResolvedValue(activeAffiliateMock)

      const updateStatusDto: AffiliateStatusUpdateDto = {
        newStatus: 'active',
      }
      const codeGenerationSpy = jest
        .spyOn(afCodeGenerator, 'affiliateCodeGenerator')
        .mockReturnValue(affiliateCodeMock)

      const updateStatusSpy = jest.spyOn(service, 'updateStatus')

      expect(
        controller.updateAffiliateStatus(activeAffiliateMock.id, updateStatusDto, adminMock),
      ).rejects.toThrow(new ConflictException('Status is the same'))
      expect(codeGenerationSpy).not.toHaveBeenCalled()
      expect(updateStatusSpy).not.toHaveBeenCalled()
    })
  })

  describe('Affiliate donations', () => {
    it('should create donation', async () => {
      const affiliateDonationDto: CreateAffiliateDonationDto = {
        campaignId: '12345',
        amount: 5000,
        billingName: 'John doe',
        isAnonymous: true,
        affiliateId: '123',
        personId: null,
        extCustomerId: '',
        extPaymentIntentId: '123456',
        extPaymentMethodId: '1234',
        billingEmail: 'test@podkrepi.bg',
        currency: 'BGN',
        toEntity: new CreateAffiliateDonationDto().toEntity,
        metadata: {
          name: '',
          extraData: {},
        },
      }
      jest.spyOn(service, 'findOneByCode').mockResolvedValue(activeAffiliateMock)
      const createAffiliateDonationSpy = jest
        .spyOn(donationService, 'createAffiliateDonation')
        .mockResolvedValue(donationResponseMock)
      jest.spyOn(prismaMock.vault, 'findMany').mockResolvedValue([vaultMock])
      await controller.createAffiliateDonation(affiliateCodeMock, affiliateDonationDto)
      expect(createAffiliateDonationSpy).toHaveBeenCalledWith({
        ...affiliateDonationDto,
        affiliateId: activeAffiliateMock.id,
      })
      expect(await donationService.createAffiliateDonation(affiliateDonationDto)).toEqual(
        donationResponseMock,
      )
    })
    it('should cancel', async () => {
      const cancelledDonationResponse: Donation = {
        ...donationResponseMock,
        status: 'cancelled',
      }
      jest
        .spyOn(donationService, 'getAffiliateDonationById')
        .mockResolvedValue(donationResponseMock)
      jest.spyOn(donationService, 'update').mockResolvedValue(cancelledDonationResponse)
      expect(
        await controller.cancelAffiliateDonation(affiliateCodeMock, donationResponseMock.id),
      ).toEqual(cancelledDonationResponse)
    })
    it('should throw error if donation status is succeeded', async () => {
      const succeededDonationResponse: Donation = {
        ...donationResponseMock,
        status: 'succeeded',
      }

      jest
        .spyOn(donationService, 'getAffiliateDonationById')
        .mockResolvedValue(succeededDonationResponse)
      const updateDonationStatus = jest.spyOn(donationService, 'update')
      expect(
        controller.cancelAffiliateDonation(affiliateCodeMock, donationResponseMock.id),
      ).rejects.toThrow(new BadRequestException("Donation status can't be updated"))
      expect(updateDonationStatus).not.toHaveBeenCalled()
    })
  })
})
