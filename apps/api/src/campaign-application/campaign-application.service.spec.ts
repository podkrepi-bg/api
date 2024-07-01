import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { BadRequestException } from '@nestjs/common'
import { CampaignApplicationState, CampaignTypeCategory } from '@prisma/client'
import { prismaMock, MockPrismaService } from '../prisma/prisma-client.mock'
import { EmailService } from '../email/email.service'

describe('CampaignApplicationService', () => {
  let service: CampaignApplicationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignApplicationService,
        MockPrismaService,
        {
          provide: EmailService,
          useValue: {
            sendFromTemplate: jest.fn(() => true),
          },
        },
      ],
    }).compile()

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

    it('should throw an error if acceptTermsAndConditions is false', () => {
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

    it('should throw an error if transparencyTermsAccepted is false', () => {
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

    it('should throw an error if personalInformationProcessingAccepted is false', () => {
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

    it('should add a new campaign-application if all agreements are true', () => {
      const dto: CreateCampaignApplicationDto = {
        ...baseDto,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: true,
      }

      expect(service.create(dto)).toBe('This action adds a new campaignApplication')
    })
  })

  describe('findAll', () => {
    it('should return an array of campaign-applications', async () => {
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
          id: 'testId2',
          createdAt: new Date('2022-04-08T06:36:33.661Z'),
          updatedAt: new Date('2022-04-08T06:36:33.662Z'),
          description: 'Test description',
          organizerId: 'testOrganizerId2',
          organizerName: 'Test Organizer2',
          organizerEmail: 'organizer2@example.com',
          beneficiary: 'test beneficary2',
          organizerPhone: '123456789',
          organizerBeneficiaryRel: 'Test Relation2',
          campaignName: 'Test Campaign2',
          goal: 'Test Goal2',
          history: 'test history2',
          amount: '2000',
          campaignGuarantee: 'test campaignGuarantee2',
          otherFinanceSources: 'test otherFinanceSources2',
          otherNotes: 'test otherNotes2',
          state: CampaignApplicationState.review,
          category: CampaignTypeCategory.medical,
          ticketURL: 'testsodifhso2',
          archived: false,
        },
      ]

      prismaMock.campaignApplication.findMany.mockResolvedValue(mockCampaigns)

      const result = await service.findAll()

      expect(result).toEqual(mockCampaigns)
      expect(prismaMock.campaignApplication.findMany).toHaveBeenCalledTimes(1)
    })

    it('should return an empty array if no campaign-applications are found', async () => {
      prismaMock.campaignApplication.findMany.mockResolvedValue([])

      const result = await service.findAll()

      expect(result).toEqual([])
      expect(prismaMock.campaignApplication.findMany).toHaveBeenCalledTimes(1)
    })

    it('should handle errors and throw an exception', async () => {
      const errorMessage = 'error'
      prismaMock.campaignApplication.findMany.mockRejectedValue(new Error(errorMessage))

      await expect(service.findAll()).rejects.toThrow(errorMessage)
      expect(prismaMock.campaignApplication.findMany).toHaveBeenCalledTimes(1)
    })
  })
})