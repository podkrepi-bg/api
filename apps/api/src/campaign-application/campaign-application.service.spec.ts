import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { BadRequestException } from '@nestjs/common'
import { CampaignApplicationState, CampaignTypeCategory, Person } from '@prisma/client'
import { prismaMock, MockPrismaService } from '../prisma/prisma-client.mock'
import { EmailService } from '../email/email.service'
import { OrganizerService } from '../organizer/organizer.service'

describe('CampaignApplicationService', () => {
  let service: CampaignApplicationService

  const mockPerson = {
    id: '3ae36b22-2c46-4038-aa17-5427e2c082e5',
    firstName: 'Martototto',
    lastName: 'dfsdf',
    email: 'martbul01@gmail.com',
    phone: null,
    createdAt: new Date('2024-06-28T21:13:29.210Z'),
    updatedAt: new Date('2024-06-28T21:13:29.210Z'),
    newsletter: true,
    helpUsImprove: true,
    address: null,
    birthday: null,
    emailConfirmed: false,
    personalNumber: null,
    companyId: null,
    keycloakId: '5a617c6f-4210-4ac3-8e1e-0464ef99f2e5',
    stripeCustomerId: null,
    picture: null,
    profileEnabled: true,
    company: null,
    beneficiaries: [],
    organizer: { id: 'ffdbcc41-85ec-476c-9e59-0662f3b433af' },
  } as Person

  const mockNewCampaignApplication = {
    campaignName: 'Test Campaign',
    organizerName: 'Test Organizer',
    organizerEmail: 'testemail@gmail.com',
    organizerPhone: '123456789',
    beneficiary: 'Test beneficary',
    organizerBeneficiaryRel: 'Test organizerBeneficiaryRel',
    goal: 'Test goal',
    history: 'Test history',
    amount: '1000',
    description: 'Test description',
    campaignGuarantee: 'Test guarantee',
    otherFinanceSources: 'Test otherFinanceSources',
    otherNotes: 'Test otherNotes',
    category: CampaignTypeCategory.medical,
  }

  const mockCampaigns = [
    {
      id: '1',
      createdAt: new Date('2022-04-08T06:36:33.661Z'),
      updatedAt: new Date('2022-04-08T06:36:33.662Z'),
      description: 'Test description1',
      organizerId: 'testOrganizerId1',
      organizerName: 'Test Organizer1',
      organizerEmail: 'organizer1@example.com',
      beneficiary: 'test beneficary1',
      organizerPhone: '123456789',
      organizerBeneficiaryRel: 'Test Relation1',
      campaignName: 'Test Campaign1',
      goal: 'Test Goal1',
      history: 'test history1',
      amount: '1000',
      campaignGuarantee: 'test campaignGuarantee1',
      otherFinanceSources: 'test otherFinanceSources1',
      otherNotes: 'test otherNotes1',
      state: CampaignApplicationState.review,
      category: CampaignTypeCategory.medical,
      ticketURL: 'testsodifhso1',
      archived: false,
    },
    {
      id: '2',
      createdAt: new Date('2022-04-08T06:36:33.661Z'),
      updatedAt: new Date('2022-04-08T06:36:33.662Z'),
      description: 'Test description2',
      organizerId: 'testOrganizerId2',
      organizerName: 'Test Organizer2',
      organizerEmail: 'organizer2@example.com',
      beneficiary: 'test beneficary2',
      organizerPhone: '123456789',
      organizerBeneficiaryRel: 'Test Relation2',
      campaignName: 'Test Campaign2',
      goal: 'Test Goal2',
      history: 'test history2',
      amount: '1000',
      campaignGuarantee: 'test campaignGuarantee2',
      otherFinanceSources: 'test otherFinanceSources2',
      otherNotes: 'test otherNotes2',
      state: CampaignApplicationState.review,
      category: CampaignTypeCategory.medical,
      ticketURL: 'testsodifhso2',
      archived: false,
    },
  ]

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

      const mockCreatedCampaignApplication = {
        id: 'mockCampaignApplicationId',
        createdAt: new Date('2022-04-08T06:36:33.661Z'),
        updatedAt: new Date('2022-04-08T06:36:33.662Z'),
        ...dto,
        organizerId: mockOrganizerId,
        state: 'review',
        ticketURL: null,
        archived: false,
      }
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
