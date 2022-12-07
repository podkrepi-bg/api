import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignReportService } from './campaign-report.service'
import { CreateReportDto } from './dto/create-report.dto'
import { plainToClass } from 'class-transformer'
import { Multer } from 'multer' // why can't it find it without this import?
import { CampaignReportFileType, PrismaClient } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateReportDto } from './dto/update-report.dto'

describe('CampaignReportService', () => {
  let service: CampaignReportService
  let s3Service: S3Service
  let prismaService: PrismaClient

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignReportService,
        MockPrismaService,
        S3Service,
        PersonService,
        ConfigService,
      ],
    }).compile()

    s3Service = module.get<S3Service>(S3Service)
    prismaService = module.get<PrismaService>(PrismaService)
    service = module.get<CampaignReportService>(CampaignReportService)
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createReport', () => {
    it('should upload files to the storage', async () => {
      const createReportDto: CreateReportDto = plainToClass(CreateReportDto, {
        description: 'descr',
        startDate: new Date(),
        endDate: new Date(),
        goals: '',
        nextSteps: '',
        additionalInfo: '',
      })

      const photos = [
        { mimetype: 'jpg', originalname: 'testName1', buffer: Buffer.from('') },
        { mimetype: 'jpg', originalname: 'testName2', buffer: Buffer.from('') },
      ] as Express.Multer.File[]

      const documents = [
        { mimetype: 'jpg', originalname: 'testName3', buffer: Buffer.from('') },
        { mimetype: 'jpg', originalname: 'testName4', buffer: Buffer.from('') },
      ] as Express.Multer.File[]

      const spy = jest
        .spyOn(s3Service, 'uploadObject')
        .mockImplementation(() => Promise.resolve(''))

      prismaService.campaignReport.create = jest
        .fn()
        .mockReturnValueOnce({ id: '1', description: 'descr' })

      prismaService.campaignReportFile.create = jest
        .fn()
        .mockReturnValueOnce({ type: CampaignReportFileType.photo, id: '1' })
        .mockReturnValueOnce({ type: CampaignReportFileType.photo, id: '2' })
        .mockReturnValueOnce({ type: CampaignReportFileType.document, id: '3' })
        .mockReturnValueOnce({ type: CampaignReportFileType.document, id: '4' })

      const result = await service.createReport(createReportDto, '1', '1', photos, documents)

      expect(spy).toHaveBeenCalledTimes(4)
      expect(spy).toHaveBeenCalledWith(
        'campaign-report-files', // bucket name
        expect.toBeString(),
        expect.toBeString(),
        'jpg', // mimetype
        expect.toBeObject(),
        'CampaignReport',
        '1', // campaign id
        '1', // user id
      )
      expect(result).toBe(createReportDto.description)
    })

    it('should throw an error on prisma error', async () => {
      const createReportDto: CreateReportDto = plainToClass(CreateReportDto, {
        description: 'descr',
        startDate: new Date(),
        endDate: new Date(),
        goals: '',
        nextSteps: '',
        additionalInfo: '',
      })

      const photos = [
        { mimetype: 'jpg', originalname: 'testName1', buffer: Buffer.from('') },
        { mimetype: 'jpg', originalname: 'testName2', buffer: Buffer.from('') },
      ] as Express.Multer.File[]

      const documents = [
        { mimetype: 'jpg', originalname: 'testName3', buffer: Buffer.from('') },
        { mimetype: 'jpg', originalname: 'testName4', buffer: Buffer.from('') },
      ] as Express.Multer.File[]

      prismaService.campaignReport.create = jest.fn().mockRejectedValue(new Error())
      await expect(
        service.createReport(createReportDto, '1', '1', photos, documents),
      ).rejects.toThrowError()
    })
  })

  describe('deleteReport', () => {
    it('should mark the report as deleted', async () => {
      const reportId = '1'

      const report = {
        id: '1',
        description: '',
        campaignId: '',
        startDate: new Date(),
        endDate: new Date(),
        totalFunds: 0,
        fundsForPeriod: 0,
        spentFundsForPeriod: 0,
        goals: '',
        nextSteps: '',
        additionalInfo: '',
        creatorId: '1',
        isDeleted: true,
      }

      prismaService.campaignReport.update = jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve({}))

      const findSpy = jest.spyOn(prismaService.campaignReport, 'findFirst').mockResolvedValue({
        id: '1',
        campaignId: '1',
        creatorId: '1',
        description: 'description',
        startDate: new Date(0),
        endDate: new Date(0),
        additionalInfo: 'additional info',
        totalFunds: 0,
        fundsForPeriod: 0,
        spentFundsForPeriod: 0,
        goals: 'goals',
        nextSteps: 'next steps',
        isDeleted: false,
      })

      const spy = jest
        .spyOn(prismaService.campaignReport, 'update')
        .mockResolvedValue({ ...report })

      const deleteSpy = jest
        .spyOn(prismaService.campaignReport, 'delete')
        .mockResolvedValue({ ...report })

      await service.softDeleteReport('1', reportId)

      expect(findSpy).toHaveBeenCalledTimes(1)

      expect(deleteSpy).not.toHaveBeenCalled()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        where: { id: reportId },
        data: { isDeleted: { set: true } },
      })
    })
  })

  describe('updateReport', () => {
    it('should update scalar fields', async () => {
      const newDates = new Date()
      const updateReportDto: UpdateReportDto = {
        daletedFileIds: [],
        description: 'new description',
        startDate: newDates,
        endDate: newDates,
        additionalInfo: 'new additional info',
        totalFunds: 1,
        fundsForPeriod: 1,
        spentFundsForPeriod: 1,
        goals: 'new goals',
        nextSteps: 'new next steps',
      }

      const findSpy = jest.spyOn(prismaService.campaignReport, 'findFirst').mockResolvedValueOnce({
        id: '1',
        campaignId: '1',
        creatorId: '1',
        description: 'description',
        startDate: new Date(0),
        endDate: new Date(0),
        additionalInfo: 'additional info',
        totalFunds: 0,
        fundsForPeriod: 0,
        spentFundsForPeriod: 0,
        goals: 'goals',
        nextSteps: 'next steps',
        isDeleted: false,
      })

      const updateSpy = jest
        .spyOn(prismaService.campaignReport, 'update')
        .mockImplementation(jest.fn())

      await service.updateReport('1', '1', '1', updateReportDto, [], [])

      expect(findSpy).toHaveBeenCalledTimes(1)
      expect(findSpy).toHaveBeenCalledWith({
        where: { id: '1', campaignId: '1' },
        select: { campaignId: true, files: true },
      })

      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          description: updateReportDto.description,
          startDate: updateReportDto.startDate,
          endDate: updateReportDto.endDate,
          additionalInfo: updateReportDto.additionalInfo,
          totalFunds: updateReportDto.totalFunds,
          fundsForPeriod: updateReportDto.fundsForPeriod,
          spentFundsForPeriod: updateReportDto.spentFundsForPeriod,
          goals: updateReportDto.goals,
          nextSteps: updateReportDto.nextSteps,
        },
      })
    })

    it('should not update anything if no report is found', async () => {
      const newDates = new Date()
      const updateReportDto: UpdateReportDto = {
        daletedFileIds: [],
        description: 'new description',
        startDate: newDates,
        endDate: newDates,
        additionalInfo: 'new additional info',
        totalFunds: 1,
        fundsForPeriod: 1,
        spentFundsForPeriod: 1,
        goals: 'new goals',
        nextSteps: 'new next steps',
      }

      const findSpy = jest
        .spyOn(prismaService.campaignReport, 'findFirst')
        .mockResolvedValueOnce(null)

      const updateSpy = jest
        .spyOn(prismaService.campaignReport, 'update')
        .mockImplementation(jest.fn())

      await expect(
        service.updateReport('1', '1', '1', updateReportDto, [], []),
      ).rejects.toThrowError()

      expect(findSpy).toHaveBeenCalledTimes(1)
      expect(updateSpy).not.toHaveBeenCalled()
    })

    it('should mark files as deleted', async () => {
      const newDates = new Date()
      const updateReportDto: UpdateReportDto = {
        daletedFileIds: ['1', '2'],
        description: 'new description',
        startDate: newDates,
        endDate: newDates,
        additionalInfo: 'new additional info',
        totalFunds: 1,
        fundsForPeriod: 1,
        spentFundsForPeriod: 1,
        goals: 'new goals',
        nextSteps: 'new next steps',
      }

      const findSpy = jest.spyOn(prismaService.campaignReport, 'findFirst').mockResolvedValueOnce({
        id: '1',
        campaignId: '1',
        creatorId: '1',
        description: 'description',
        startDate: new Date(0),
        endDate: new Date(0),
        additionalInfo: 'additional info',
        totalFunds: 0,
        fundsForPeriod: 0,
        spentFundsForPeriod: 0,
        goals: 'goals',
        nextSteps: 'next steps',
        isDeleted: false,
        files: [
          {
            id: '1',
            reportId: '1',
            filename: '',
            mimetype: '',
            type: CampaignReportFileType.document,
            personId: '',
            isDeleted: false,
          },
          {
            id: '2',
            reportId: '1',
            filename: '',
            mimetype: '',
            type: CampaignReportFileType.document,
            personId: '',
            isDeleted: false,
          },
        ] as any,
      })

      const updateSpy = jest
        .spyOn(prismaService.campaignReport, 'update')
        .mockImplementation(jest.fn())

      const softDeleteSpy = jest
        .spyOn(prismaService.campaignReportFile, 'update')
        .mockImplementation(jest.fn())

      const findFileSpy = jest
        .spyOn(prismaService.campaignReportFile, 'findFirst')
        .mockResolvedValueOnce({
          filename: 'wow',
          mimetype: 'jpg',
          creatorId: '1',
          id: '1',
          reportId: '1',
          isDeleted: false,
          type: CampaignReportFileType.document,
        })
        .mockResolvedValueOnce({
          filename: 'wow',
          mimetype: 'jpg',
          creatorId: '1',
          id: '2',
          reportId: '1',
          isDeleted: false,
          type: CampaignReportFileType.document,
        })

      await service.updateReport('1', '1', '1', updateReportDto, [], [])

      expect(findSpy).toHaveBeenCalledTimes(1)
      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(softDeleteSpy).toHaveBeenCalledTimes(2)
      expect(findFileSpy).toHaveBeenCalledTimes(2)

      expect(softDeleteSpy).toHaveBeenNthCalledWith(1, {
        where: { id: '1' },
        data: { isDeleted: true },
      })

      expect(softDeleteSpy).toHaveBeenNthCalledWith(2, {
        where: { id: '2' },
        data: { isDeleted: true },
      })
    })

    it('should create new files if any', async () => {
      const newDates = new Date()
      const updateReportDto: UpdateReportDto = {
        daletedFileIds: ['1', '2'],
        description: 'new description',
        startDate: newDates,
        endDate: newDates,
        additionalInfo: 'new additional info',
        totalFunds: 1,
        fundsForPeriod: 1,
        spentFundsForPeriod: 1,
        goals: 'new goals',
        nextSteps: 'new next steps',
      }

      const photos = [
        { mimetype: 'jpg', originalname: 'testName1', buffer: Buffer.from('') },
        { mimetype: 'jpg', originalname: 'testName2', buffer: Buffer.from('') },
      ] as Express.Multer.File[]

      const documents = [
        { mimetype: 'jpg', originalname: 'testName3', buffer: Buffer.from('') },
      ] as Express.Multer.File[]

      const findSpy = jest.spyOn(prismaService.campaignReport, 'findFirst').mockResolvedValueOnce({
        id: '1',
        campaignId: '1',
        creatorId: '1',
        description: 'description',
        startDate: new Date(0),
        endDate: new Date(0),
        additionalInfo: 'additional info',
        totalFunds: 0,
        fundsForPeriod: 0,
        spentFundsForPeriod: 0,
        goals: 'goals',
        nextSteps: 'next steps',
        isDeleted: false,
      })

      const updateSpy = jest
        .spyOn(prismaService.campaignReport, 'update')
        .mockImplementation(jest.fn())

      const createFileSpy = jest
        .spyOn(prismaService.campaignReportFile, 'create')
        .mockResolvedValue({
          id: '1',
          reportId: '1',
          filename: '',
          mimetype: '',
          creatorId: '1',
          type: CampaignReportFileType.document,
          isDeleted: false,
        })

      const s3UploadSpy = jest
        .spyOn(s3Service, 'uploadObject')
        .mockImplementation(() => Promise.resolve(''))

      await service.updateReport('1', '1', '1', updateReportDto, photos, documents)

      expect(findSpy).toHaveBeenCalledTimes(1)
      expect(updateSpy).toHaveBeenCalledTimes(1)

      expect(createFileSpy).toHaveBeenCalledTimes(3)
      expect(s3UploadSpy).toHaveBeenCalledTimes(3)
    })
  })
})
