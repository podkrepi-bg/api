import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { BadRequestException, HttpStatus } from '@nestjs/common'
import { CampaignState, Currency } from '@prisma/client'
import { CreateCampaignDto } from '../campaign/dto/create-campaign.dto'
import { prismaMock, MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignService } from '../campaign/campaign.service'
import { NotificationService } from '../sockets/notifications/notification.service'
import { VaultService } from '../vault/vault.service'
import { ConfigService } from '@nestjs/config'
import { MarketingNotificationsService } from '../notifications/notifications.service'
import { PersonService } from '../person/person.service'
import { EmailService } from '../email/email.service'
import { NotificationsProviderInterface } from '../notifications/providers/notifications.interface.providers'
import { SendGridNotificationsProvider } from '../notifications/providers/notifications.sendgrid.provider'
import { NotificationGateway } from '../sockets/notifications/gateway'
import { TemplateService } from '../email/template.service'
describe('CampaignApplicationService', () => {
  let service: CampaignApplicationService

  const mockCreateCampaign = {
    slug: 'test-slug',
    title: 'Test name',
    description: 'Test description',
    essence: 'test',
    coordinatorId: 'testCoordinatorId',
    beneficiaryId: 'testBeneficiaryId',
    organizerId: 'testOrganizerId',
    companyId: 'testCompanyId',
    campaignTypeId: 'testCampaignTypeId',
    targetAmount: 1000,
    reachedAmount: 0,

    startDate: new Date('2021-04-08T06:36:33.661Z'),
    endDate: new Date('2023-04-08T06:36:33.661Z'),
    currency: Currency.BGN,
    // donationWish: undefined,
    allowDonationOnComplete: true,
    toEntity: new CreateCampaignDto().toEntity,
  } as CreateCampaignDto

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          // Use the interface as token
          provide: NotificationsProviderInterface,
          // But actually provide the service that implements the interface
          useClass: SendGridNotificationsProvider,
        },
        CampaignService,
        MockPrismaService,
        NotificationService,
        VaultService,
        MarketingNotificationsService,
        ConfigService,
        PersonService,
        EmailService,
        NotificationGateway,
        TemplateService,
        CampaignApplicationService,
      ],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendFromTemplate: jest.fn(() => {
          return true
        }),
      })
      .compile()

    service = module.get<CampaignApplicationService>(CampaignApplicationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createNewApplication', () => {
    const baseDto = {
      campaignName: 'Test Campaign',
      organizerName: 'Test Organizer',
      organizerEmail: 'organizer@example.com',
      organizerPhone: '123456789',
      beneficiary: 'Test Beneficiary',
      organizerBeneficiaryRel: 'Test Relation',
      goal: 'Test Goal',
      amount: '1000',
      toEntity: jest.fn(),
    }
    it('should throw an error if acceptTermsAndConditions are not accepted', () => {
      const dto: CreateCampaignApplicationDto = {
        ...baseDto,
        acceptTermsAndConditions: false,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: true,
      }

      expect(() => service.create(dto)).toThrow(
        new BadRequestException('All agreements must be checked'),
      )
    })

    it('should throw an error if transparencyTermsAccepted  are not accepted', () => {
      const dto: CreateCampaignApplicationDto = {
        ...baseDto,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: false,
        personalInformationProcessingAccepted: true,
      }

      expect(() => service.create(dto)).toThrow(
        new BadRequestException('All agreements must be checked'),
      )
    })

    it('should throw an error if personalInformationProcessingAccepted is not accepted', () => {
      const dto: CreateCampaignApplicationDto = {
        ...baseDto,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: false,
      }

      expect(() => service.create(dto)).toThrow(
        new BadRequestException('All agreements must be checked'),
      )
    })

    it('should add a new campaign application if all agreements are accepted', () => {
      const dto: CreateCampaignApplicationDto = {
        ...baseDto,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: true,
      }

      expect(service.create(dto)).toBe('This action adds a new campaignApplication')
    })
  })

  describe('find all(GET) campains', () => {
    it('should return an array of campaign applications', async () => {
      const paymentReferenceMock = 'NY5P-KVO4-DNBZ'
      const mockCampaigns = [
        {
          ...mockCreateCampaign,
          ...{
            id: 'testId',
            state: CampaignState.draft,
            createdAt: new Date('2022-04-08T06:36:33.661Z'),
            updatedAt: new Date('2022-04-08T06:36:33.662Z'),
            deletedAt: null,
            approvedById: null,
            beneficiary: { person: { keycloakId: 'some-id' } },
            coordinator: { person: { keycloakId: 'some-id' } },
            organizer: { person: { keycloakId: 'some-id' } },
            paymentReference: paymentReferenceMock,
            campaignFiles: [],
            donationWish: [],
            irregularities: [],
            outgoingTransfers: [],
            incomingTransfers: [],
            vaults: [],
            slugArchive: [],
            withdrawals: [],
            notificationLists: [],
            campaignNews: [],
          },
        },
        {
          ...mockCreateCampaign,
          ...{
            id: 'testId',
            state: CampaignState.draft,
            createdAt: new Date('2022-04-08T06:36:33.661Z'),
            updatedAt: new Date('2022-04-08T06:36:33.662Z'),
            deletedAt: null,
            approvedById: null,
            beneficiary: { person: { keycloakId: 'some-id2' } },
            coordinator: { person: { keycloakId: 'some-id2' } },
            organizer: { person: { keycloakId: 'some-id2' } },
            paymentReference: paymentReferenceMock,
            campaignFiles: [],
            donationWish: [],
            irregularities: [],
            outgoingTransfers: [],
            incomingTransfers: [],
            withdrawals: [],
            slugArchive: [],
            campaignNews: [],
            vaults: [],
            notificationLists: [],
          },
        },
      ]

      prismaMock.campaignApplication.findMany.mockResolvedValue(mockCampaigns)

      const result = await service.findAll()

      expect(result).toEqual(mockCampaigns)
      expect(prismaMock.campaignApplication.findMany).toHaveBeenCalledTimes(1)
    })

    it('should return an empty array if no campaigns are found', async () => {
      prismaMock.campaignApplication.findMany.mockResolvedValue([])

      const result = await service.findAll()

      expect(result).toEqual([])
      expect(prismaMock.campaignApplication.findMany).toHaveBeenCalledTimes(1)
    })

    it('should handle errors and throw an exception', async () => {
      const errorMessage = 'Database error'
      prismaMock.campaignApplication.findMany.mockRejectedValue(new Error(errorMessage))

      await expect(service.findAll()).rejects.toThrow(errorMessage)
      expect(prismaMock.campaignApplication.findMany).toHaveBeenCalledTimes(1)
    })
  })
})
