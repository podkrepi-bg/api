import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { BadRequestException } from '@nestjs/common'
import { CampaignApplicationState, CampaignTypeCategory, Person } from '@prisma/client'
import { prismaMock, MockPrismaService } from '../prisma/prisma-client.mock'
import { EmailService } from '../email/email.service'
import { OrganizerService } from '../organizer/organizer.service'
import { personMock } from '../person/__mock__/personMock'
import {
  mockCampaigns,
  mockCreatedCampaignApplication,
  mockNewCampaignApplication,
} from './__mocks__/campaign-application-mocks'

describe('CampaignApplicationService', () => {
  let service: CampaignApplicationService

  const mockPerson = {
    ...personMock,
    company: null,
    beneficiaries: [],
    organizer: { id: 'ffdbcc41-85ec-476c-9e59-0662f3b433af' },
  } as Person

  const mockOrganizerService = {
    create: jest.fn().mockResolvedValue({
      id: 'mockOrganizerId',
      personId: mockPerson.id,
    }),
  }

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
        MockPrismaService,
        {
          provide: OrganizerService,
          useValue: mockOrganizerService,
        },
      ],
    }).compile()

    service = module.get<CampaignApplicationService>(CampaignApplicationService)
  })
  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createNewApplication', () => {
    it('should throw an error if acceptTermsAndConditions is false', async () => {
      const dto: CreateCampaignApplicationDto = {
        ...mockNewCampaignApplication,
        acceptTermsAndConditions: false,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: true,
        toEntity: new CreateCampaignApplicationDto().toEntity,
      }

      await expect(service.create(dto, mockPerson)).rejects.toThrow(
        new BadRequestException('All agreements must be checked'),
      )
    })

    it('should throw an error if transparencyTermsAccepted is false', async () => {
      const dto: CreateCampaignApplicationDto = {
        ...mockNewCampaignApplication,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: false,
        personalInformationProcessingAccepted: true,
        toEntity: new CreateCampaignApplicationDto().toEntity,
      }

      await expect(service.create(dto, mockPerson)).rejects.toThrow(
        new BadRequestException('All agreements must be checked'),
      )
    })

    it('should throw an error if personalInformationProcessingAccepted is false', async () => {
      const dto: CreateCampaignApplicationDto = {
        ...mockNewCampaignApplication,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: false,
        toEntity: new CreateCampaignApplicationDto().toEntity,
      }

      await expect(service.create(dto, mockPerson)).rejects.toThrow(
        new BadRequestException('All agreements must be checked'),
      )
    })

    it('should add a new campaign-application if all agreements are true', async () => {
      const dto: CreateCampaignApplicationDto = {
        ...mockNewCampaignApplication,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: true,
        toEntity: new CreateCampaignApplicationDto().toEntity,
      }

      const mockOrganizerId = 'mockOrganizerId'
      jest.spyOn(mockOrganizerService, 'create').mockResolvedValue({
        id: mockOrganizerId,
        personId: mockPerson.id,
      })

      jest
        .spyOn(prismaMock.campaignApplication, 'create')
        .mockResolvedValue(mockCreatedCampaignApplication)

      const result = await service.create(dto, mockPerson)

      expect(result).toEqual(mockCreatedCampaignApplication)

      expect(mockOrganizerService.create).toHaveBeenCalledWith({
        personId: mockPerson.id,
      })

      expect(prismaMock.campaignApplication.create).toHaveBeenCalledWith({
        data: {
          campaignName: dto.campaignName.trim(),
          organizerName: dto.organizerName.trim(),
          organizerEmail: dto.organizerEmail.trim(),
          organizerPhone: dto.organizerPhone.trim(),
          beneficiary: dto.beneficiary.trim(),
          organizerBeneficiaryRel: dto.organizerBeneficiaryRel.trim(),
          goal: dto.goal.trim(),
          history: dto.history?.trim(),
          amount: dto.amount.trim(),
          description: dto.description?.trim(),
          campaignGuarantee: dto.campaignGuarantee?.trim(),
          otherFinanceSources: dto.otherFinanceSources?.trim(),
          otherNotes: dto.otherNotes?.trim(),
          category: dto.category,
          organizerId: mockOrganizerId,
        },
      })

      expect(mockOrganizerService.create).toHaveBeenCalledTimes(1)
      expect(prismaMock.campaignApplication.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('findAll', () => {
    it('should return an array of campaign-applications', async () => {
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
