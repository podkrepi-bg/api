import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { BadRequestException } from '@nestjs/common'
import { Person } from '@prisma/client'
import { prismaMock, MockPrismaService } from '../prisma/prisma-client.mock'
import { EmailService } from '../email/email.service'
import { OrganizerService } from '../organizer/organizer.service'
import { personMock } from '../person/__mock__/personMock'
import {
  mockCampaignApplicationFile,
  mockCampaignApplicationFiles,
  mockCampaigns,
  mockCreatedCampaignApplication,
  mockNewCampaignApplication,
  mockCampaignApplicationUploadFile,
} from './__mocks__/campaign-application-mocks'
import { S3Service } from '../s3/s3.service'
import { PrismaService } from '../prisma/prisma.service'

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

  const mockS3Service = {
    uploadObject: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignApplicationService,
        MockPrismaService,
        { provide: OrganizerService, useValue: mockOrganizerService },
        { provide: S3Service, useValue: mockS3Service },
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

      await expect(service.create(dto, mockPerson, mockCampaignApplicationFiles)).rejects.toThrow(
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

      await expect(service.create(dto, mockPerson, mockCampaignApplicationFiles)).rejects.toThrow(
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

      await expect(service.create(dto, mockPerson, mockCampaignApplicationFiles)).rejects.toThrow(
        new BadRequestException('All agreements must be checked'),
      )
    })

    it('should add a new campaign-application to db if all agreements are true', async () => {
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

      //! working on it
      jest
        .spyOn(prismaMock.campaignApplication, 'create')
        .mockResolvedValue(mockCreatedCampaignApplication)

      jest
        .spyOn(prismaMock.campaignApplicationFile, 'create')
        .mockResolvedValue(mockCampaignApplicationFile)

      jest.spyOn(mockS3Service, 'uploadObject').mockResolvedValue(mockCampaignApplicationUploadFile)

      const result = await service.create(dto, mockPerson, mockCampaignApplicationFiles)

      expect(result).toEqual(mockCreatedCampaignApplication)

      expect(mockOrganizerService.create).toHaveBeenCalledWith({
        personId: mockPerson.id,
      })

      expect(prismaMock.campaignApplication.create).toHaveBeenCalledWith({
        data: {
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
          organizerId: mockOrganizerId,
        },
      })
      expect(prismaMock.campaignApplicationFile.create).toHaveBeenCalledWith(
        mockCampaignApplicationFile,
      )

      expect(mockS3Service.uploadObject).toHaveBeenCalledWith(mockCampaignApplicationFile)
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
