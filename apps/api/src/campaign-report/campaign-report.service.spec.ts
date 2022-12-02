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
    it('should mark the file as deleted', async () => {
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
        isDeleted: true
      }
      
      prismaService.campaignReport.update = jest.fn().mockImplementationOnce(() => Promise.resolve({}))

      const spy = jest.spyOn(prismaService.campaignReport, 'update')
        .mockResolvedValue({...report})
      
      const deleteSpy = jest.spyOn(prismaService.campaignReport, 'delete')
        .mockResolvedValue({...report})

      await service.softDeleteReport(reportId)

      expect(deleteSpy).not.toHaveBeenCalled()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        where: { id: reportId },
        data: { isDeleted: { set: true } }
      })
    })
  })
})
