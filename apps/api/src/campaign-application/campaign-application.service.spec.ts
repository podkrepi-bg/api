import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { OrganizerService } from '../organizer/organizer.service'
import { personMock } from '../person/__mock__/personMock'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { S3Service } from '../s3/s3.service'
import {
  mockCampaigns,
  mockCreatedCampaignApplication,
  mockNewCampaignApplication,
  mockSingleCampaignApplication,
  mockUpdateCampaignApplication,
} from './__mocks__/campaign-application-mocks'
import {
  mockCampaignApplicationFileFn,
  mockCampaignApplicationFilesFn,
} from './__mocks__/campaing-application-file-mocks'
import { CampaignApplicationService } from './campaign-application.service'
import {
  CreateCampaignApplicationAdminEmailDto,
  CreateCampaignApplicationOrganizerEmailDto,
} from '../email/template.interface'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { EmailService } from '../email/email.service'
import { ConfigService } from 'aws-sdk'
import { ConfigModule } from '@nestjs/config'

describe('CampaignApplicationService', () => {
  let service: CampaignApplicationService
  let configService: ConfigService

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
    streamFile: jest.fn().mockResolvedValue(1234),
  }

  const mockEmailService = {
    sendFromTemplate: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(async () => ({
          APP_URL: process.env.APP_URL,
        })),
      ],
      providers: [
        CampaignApplicationService,
        MockPrismaService,
        { provide: OrganizerService, useValue: mockOrganizerService },
        { provide: S3Service, useValue: mockS3Service },
        { provide: EmailService, useValue: mockEmailService },
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

    it('should add a new campaign-application to db a if all agreements are true', async () => {
      const dto: CreateCampaignApplicationDto = {
        ...mockNewCampaignApplication,
        acceptTermsAndConditions: true,
        transparencyTermsAccepted: true,
        personalInformationProcessingAccepted: true,
        toEntity: new CreateCampaignApplicationDto().toEntity,
        campaignEndDate: '2024-01-01',
      }

      const mockOrganizerId = 'mockOrganizerId'
      jest.spyOn(mockOrganizerService, 'create').mockResolvedValue({
        id: mockOrganizerId,
        personId: mockPerson.id,
      })

      jest
        .spyOn(prismaMock.campaignApplication, 'create')
        .mockResolvedValue(mockCreatedCampaignApplication)

      const sendEmailsOnCreatedCampaignApplicationSpy = jest
        .spyOn(service, 'sendEmailsOnCreatedCampaignApplication')
        .mockResolvedValue(undefined)

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
          campaignTypeId: 'ffdbcc41-85ec-0000-9e59-0662f3b433af',
          organizerId: mockOrganizerId,
          campaignEnd: 'funds',
          campaignEndDate: new Date('2024-01-01T00:00:00.000Z'),
        },
      })

      expect(sendEmailsOnCreatedCampaignApplicationSpy).toHaveBeenCalledWith(
        mockCreatedCampaignApplication.campaignName,
        mockCreatedCampaignApplication.id,
        mockPerson,
      )

      expect(mockOrganizerService.create).toHaveBeenCalledTimes(1)
      expect(prismaMock.campaignApplication.create).toHaveBeenCalledTimes(1)
      expect(sendEmailsOnCreatedCampaignApplicationSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('sendEmailsOnCreatedCampaignApplication', () => {
    it('should send emails to both the organizer and the admin', async () => {
      const mockAdminEmail = 'campaign_coordinators@podkrepi.bg'
      const userEmail = { to: [mockPerson.email] }
      const adminEmail = { to: [mockAdminEmail] }

      const emailAdminData = {
        campaignApplicationName: mockSingleCampaignApplication.campaignName,
        campaignApplicationLink: `${process.env.APP_URL}/admin/campaigns/edit/${mockSingleCampaignApplication.id}`,
        email: mockPerson.email as string,
        firstName: mockPerson.firstName,
      }

      const emailOrganizerData = {
        campaignApplicationName: mockSingleCampaignApplication.campaignName,
        campaignApplicationLink: `${process.env.APP_URL}/campaigns/application/${mockSingleCampaignApplication.id}`,
        email: mockPerson.email as string,
        firstName: mockPerson.firstName,
      }

      const mailAdmin = new CreateCampaignApplicationAdminEmailDto(emailAdminData)
      const mailOrganizer = new CreateCampaignApplicationOrganizerEmailDto(emailOrganizerData)

      mockEmailService.sendFromTemplate.mockResolvedValueOnce(undefined)

      await service.sendEmailsOnCreatedCampaignApplication(
        mockSingleCampaignApplication.campaignName,
        mockSingleCampaignApplication.id,
        mockPerson,
      )

      expect(mockEmailService.sendFromTemplate).toHaveBeenNthCalledWith(
        1,
        mailOrganizer,
        userEmail,
        {
          bypassUnsubscribeManagement: { enable: true },
        },
      )

      expect(mockEmailService.sendFromTemplate).toHaveBeenNthCalledWith(2, mailAdmin, adminEmail, {
        bypassUnsubscribeManagement: { enable: true },
      })

      expect(mockEmailService.sendFromTemplate).toHaveBeenCalledTimes(2)
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
      expect(prismaMock.campaignApplication.findUnique).toHaveBeenCalledWith({
        where: { id: 'id' },
        include: {
          documents: {
            select: {
              id: true,
              filename: true,
              mimetype: true,
            },
          },
        },
      })
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
          campaignEndDate: new Date('2024-09-09T00:00:00.000Z'),
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
          campaignEndDate: new Date('2024-09-09T00:00:00.000Z'),
        },
      })
    })
  })

  describe('getFile', () => {
    it('should return a single campaign-application file', async () => {
      prismaMock.campaignApplication.findFirst.mockResolvedValue(mockSingleCampaignApplication)
      prismaMock.campaignApplicationFile.findFirst.mockResolvedValue({
        id: '123',
        filename: 'my-file',
      } as File)

      const result = await service.getFile('id', false, mockPerson)

      expect(result).toEqual({
        filename: 'my-file',
        stream: 1234,
      })
      expect(prismaMock.campaignApplication.findFirst).toHaveBeenCalledTimes(1)
      expect(prismaMock.campaignApplication.findFirst).toHaveBeenCalledWith({
        where: {
          documents: {
            some: {
              id: 'id',
            },
          },
        },
      })

      expect(prismaMock.campaignApplicationFile.findFirst).toHaveBeenNthCalledWith(1, {
        where: { id: 'id' },
      })
    })

    it('should throw a NotFoundException if no campaign-application is found', async () => {
      prismaMock.campaignApplication.findUnique.mockResolvedValue(null)

      await expect(service.getFile('id', false, mockPerson)).rejects.toThrow(
        new NotFoundException('File does not exist'),
      )
    })

    it('should handle errors and throw an exception', async () => {
      const errorMessage = 'error'
      prismaMock.campaignApplication.findFirst.mockRejectedValue(new Error(errorMessage))

      await expect(service.getFile('id', false, mockPerson)).rejects.toThrow(errorMessage)
    })

    it('should not allow non-admin users to see files belonging to other users', async () => {
      prismaMock.campaignApplication.findFirst.mockResolvedValue(mockSingleCampaignApplication)
      await expect(
        service.getFile('id', false, { ...mockPerson, organizer: { id: 'different-id' } }),
      ).rejects.toThrow(
        new ForbiddenException('User is not admin or organizer of the campaignApplication'),
      )
    })

    it('should allow admin users to see files belonging to other users', async () => {
      prismaMock.campaignApplication.findFirst.mockResolvedValue(mockSingleCampaignApplication)
      prismaMock.campaignApplicationFile.findFirst.mockResolvedValue({
        id: '123',
        filename: 'my-file',
      } as File)
      await expect(
        service.getFile('id', true, { ...mockPerson, organizer: { id: 'different-id' } }),
      ).resolves.not.toThrow(
        new ForbiddenException('User is not admin or organizer of the campaignApplication'),
      )
    })
  })
})
