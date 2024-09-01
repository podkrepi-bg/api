import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { CampaignApplicationFileRole, CampaignTypeCategory, Person } from '@prisma/client'
import { prismaMock, MockPrismaService } from '../prisma/prisma-client.mock'
import { OrganizerService } from '../organizer/organizer.service'
import { personMock } from '../person/__mock__/personMock'
import {
  mockCampaigns,
  mockCreatedCampaignApplication,
  mockNewCampaignApplication,
  mockSingleCampaignApplication,
  mockUpdateCampaignApplication,
} from './__mocks__/campaign-application-mocks'
import { S3Service } from '../s3/s3.service'
import {
  mockCampaignApplicationFileFn,
  mockCampaignApplicationFilesFn,
  mockCampaignApplicationUploadFileFn,
} from './__mocks__/campaing-application-file-mocks'

describe('CampaignApplicationService', () => {
  let service: CampaignApplicationService

  const mockPerson = {
    ...personMock,
    company: null,
    beneficiaries: [],
    organizer: { id: 'ffdbcc41-85ec-476c-9e59-0662f3b433af' },
  }

  const mockOrganizerService = {
    create: jest.fn().mockResolvedValue({
      id: 'mockOrganizerId',
      personId: mockPerson.id,
    }),
  }

  const mockS3Service = {
    uploadObject: jest.fn(),
    deleteObject: jest.fn(),
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

      expect(mockOrganizerService.create).toHaveBeenCalledTimes(1)
      expect(prismaMock.campaignApplication.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('uploadFile', () => {
    it('should add files to a campaignApplication and upload them to s3', async () => {
      const mockCampaignApplicationFiles = mockCampaignApplicationFilesFn()
      const mockCampaignApplicationFile = mockCampaignApplicationFileFn()

      jest
        .spyOn(prismaMock.campaignApplicationFile, 'create')
        .mockResolvedValue(mockCampaignApplicationFile)
      jest
        .spyOn(service, 'campaignApplicationFilesCreate')
        .mockResolvedValueOnce(mockCampaignApplicationFile)

      const result = await service.uploadFiles(
        'mockCampaignApplicationId',
        mockPerson,
        mockCampaignApplicationFiles,
      )

      expect(result).toEqual([mockCampaignApplicationFile, mockCampaignApplicationFile])
      expect(service.campaignApplicationFilesCreate).toHaveBeenCalledTimes(2)
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

  describe('findOne', () => {
    it('should return a single campaign-application', async () => {
      prismaMock.campaignApplication.findUnique.mockResolvedValue(mockSingleCampaignApplication)

      const result = await service.findOne('id', false, mockPerson)

      expect(result).toEqual(mockSingleCampaignApplication)
      expect(prismaMock.campaignApplication.findUnique).toHaveBeenCalledTimes(1)
    })

    it('should throw a NotFoundException if no campaign-application is found', async () => {
      prismaMock.campaignApplication.findUnique.mockResolvedValue(null)

      await expect(service.findOne('id', false, mockPerson)).rejects.toThrow(
        new NotFoundException('Campaign application doesnt exist'),
      )
      expect(prismaMock.campaignApplication.findUnique).toHaveBeenCalledTimes(1)
    })

    it('should handle errors and throw an exception', async () => {
      const errorMessage = 'error'
      prismaMock.campaignApplication.findUnique.mockRejectedValue(new Error(errorMessage))

      await expect(service.findOne('id', false, mockPerson)).rejects.toThrow(errorMessage)
      expect(prismaMock.campaignApplication.findUnique).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteFile', () => {
    it('should return a message on successful deletion', async () => {
      prismaMock.campaignApplication.findFirst.mockResolvedValue(mockSingleCampaignApplication)

      const result = await service.deleteFile('fileId', false, mockPerson)

      expect(result).toEqual('Successfully deleted file')
      expect(prismaMock.campaignApplication.findFirst).toHaveBeenCalledTimes(1)
    })

    it('should throw a NotFoundException if no campaign-application is found', async () => {
      prismaMock.campaignApplication.findUnique.mockResolvedValue(null)

      await expect(service.deleteFile('fileId', false, mockPerson)).rejects.toThrow(
        new NotFoundException('File does not exist'),
      )
      expect(prismaMock.campaignApplication.findFirst).toHaveBeenCalledTimes(1)
    })

    it('should handle errors and throw an exception', async () => {
      const errorMessage = 'error'
      prismaMock.campaignApplication.findFirst.mockRejectedValue(new Error(errorMessage))

      await expect(service.deleteFile('fileId', false, mockPerson)).rejects.toThrow(errorMessage)
      expect(prismaMock.campaignApplication.findFirst).toHaveBeenCalledTimes(1)
      expect(prismaMock.campaignApplicationFile.delete).not.toHaveBeenCalled()
    })
  })

  describe('updateCampaignApplication', () => {
    it('should update a campaign application if the user is the organizer', async () => {
      const mockCampaignApplication = {
        ...mockCreatedCampaignApplication,
        organizerId: mockPerson.organizer.id,
      }

      prismaMock.campaignApplication.findUnique.mockResolvedValue(mockCampaignApplication)
      prismaMock.campaignApplication.update.mockResolvedValue(mockCampaignApplication)

      const result = await service.updateCampaignApplication(
        '1',
        mockUpdateCampaignApplication,
        false,
        mockPerson.organizer.id,
      )

      expect(result).toEqual(mockCampaignApplication)
      expect(prismaMock.campaignApplication.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          ...mockUpdateCampaignApplication,
        },
      })
    })

    it('should throw a NotFoundException if the campaign application is not found', async () => {
      prismaMock.campaignApplication.findUnique.mockResolvedValue(null)

      await expect(
        service.updateCampaignApplication(
          '1',
          mockUpdateCampaignApplication,
          false,
          mockPerson.organizer.id,
        ),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw a ForbiddenException if the user is not the organizer and not an admin', async () => {
      const mockCampaignApplication = {
        ...mockCreatedCampaignApplication,
        organizerId: 'different-organizer-id',
      }

      prismaMock.campaignApplication.findUnique.mockResolvedValue(mockCampaignApplication)

      await expect(
        service.updateCampaignApplication(
          '1',
          mockUpdateCampaignApplication,
          false,
          mockPerson.organizer.id,
        ),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should update a campaign application if the user is an admin', async () => {
      const mockCampaignApplication = {
        ...mockCreatedCampaignApplication,
        organizerId: 'different-organizer-id',
      }

      prismaMock.campaignApplication.findUnique.mockResolvedValue(mockCampaignApplication)
      prismaMock.campaignApplication.update.mockResolvedValue(mockCampaignApplication)

      const result = await service.updateCampaignApplication(
        '1',
        mockUpdateCampaignApplication,
        true,
      )

      expect(result).toEqual(mockCampaignApplication)
      expect(prismaMock.campaignApplication.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          ...mockUpdateCampaignApplication,
        },
      })
    })
  })
})
