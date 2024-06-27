import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { BadRequestException, HttpStatus } from '@nestjs/common'
import {
  CampaignApplicationState,
  CampaignState,
  CampaignTypeCategory,
  Currency,
} from '@prisma/client'
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
      const mockCampaigns = [
        {
          id: 'testId',
          createdAt: new Date('2022-04-08T06:36:33.661Z'),
          updatedAt: new Date('2022-04-08T06:36:33.662Z'),
          description: 'Test description',
          organizerId: 'testOrganizerId1',
          organizerName: 'Test Organizer1',
          organizerEmail: 'organizer@example.com',
          beneficiary: 'test beneficary',
          organizerPhone: '123456789',
          organizerBeneficiaryRel: 'Test Relation',
          campaignName: 'Test Campaign',
          goal: 'Test Goal',
          history: 'test history',
          amount: '1000',
          campaignGuarantee: 'test campaignGuarantee',
          otherFinanceSources: 'test otherFinanceSources',
          otherNotes: 'test otherNotes',
          state: CampaignApplicationState.review,
          category: CampaignTypeCategory.medical,
          ticketURL: 'testsodifhso',
          archived: false,
        },
        {
          id: 'testId',
          createdAt: new Date('2022-04-08T06:36:33.661Z'),
          updatedAt: new Date('2022-04-08T06:36:33.662Z'),
          description: 'Test description',
          organizerId: 'testOrganizerId1',
          organizerName: 'Test Organizer1',
          organizerEmail: 'organizer@example.com',
          beneficiary: 'test beneficary',
          organizerPhone: '123456789',
          organizerBeneficiaryRel: 'Test Relation',
          campaignName: 'Test Campaign',
          goal: 'Test Goal',
          history: 'test history',
          amount: '1000',
          campaignGuarantee: 'test campaignGuarantee',
          otherFinanceSources: 'test otherFinanceSources',
          otherNotes: 'test otherNotes',
          state: CampaignApplicationState.review,
          category: CampaignTypeCategory.medical,
          ticketURL: 'testsodifhso',
          archived: false,
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
