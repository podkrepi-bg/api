import { Injectable } from '@nestjs/common'
import { CampaignReport, CampaignReportFile, CampaignReportFileType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { CreateReportDto } from './dto/create-report.dto'
import { GetReportDto } from './dto/get-report.dto'
import { ListReportsDto } from './dto/list-reports.dto'
import { UpdateReportDto } from './dto/update-report.dto'

@Injectable()
export class CampaignReportService {
  constructor(private prisma: PrismaService, private s3: S3Service) {}

  private readonly bucketName = 'campaign-report-files'

  async getReports(campaignId: string, includeDeleted = false): Promise<ListReportsDto[]> {
    return this.prisma.campaignReport.findMany({
      where: {
        campaignId,
        isDeleted: includeDeleted,
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        description: true,
      },
    })
  }

  async getReport(reportId: string, includeDeleted = false): Promise<GetReportDto | null> {
    const report = this.prisma.campaignReport.findFirst({
      where: {
        id: reportId,
        isDeleted: includeDeleted,
      },
      select: {
        files: {
          where: {
            isDeleted: false,
          },
        },
      },
    })

    if (report === null) {
      return null
    }

    const files = await report.files()
    const photos = files.filter((file) => file.type === CampaignReportFileType.photo)
    const documents = files.filter((file) => file.type === CampaignReportFileType.document)

    return {
      ...report,
      photos,
      documents,
    }
  }

  async createReport(
    createReportDto: CreateReportDto,
    campaignId: string,
    userId: string,
    photos: Express.Multer.File[],
    documents: Express.Multer.File[],
  ): Promise<string> {
    const createdReport = await this.prisma.campaignReport.create({
      data: {
        ...createReportDto.toEntity(campaignId, userId),
      },
    })

    await this.uploadFiles(campaignId, createdReport.id, userId, photos, documents)

    return Promise.resolve(createdReport.description)
  }

  async updateReport(
    reportId: string,
    userId: string,
    updateReportDto: UpdateReportDto,
    newPhotos: Express.Multer.File[],
    newDocuments: Express.Multer.File[],
  ) {
    const report = await this.prisma.campaignReport.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return undefined
    }

    // Update basic report data
    await this.prisma.campaignReport.update({
      where: { id: reportId },
      data: {
        description: updateReportDto.description,
        startDate: updateReportDto.startDate,
        endDate: updateReportDto.endDate,
        totalFunds: updateReportDto.totalFunds,
        fundsForPeriod: updateReportDto.fundsForPeriod,
        spentFundsForPeriod: updateReportDto.spentFundsForPeriod,
        goals: updateReportDto.goals,
        nextSteps: updateReportDto.nextSteps,
        additionalInfo: updateReportDto.additionalInfo,
      },
    })

    // Mark files as deleted
    await Promise.all(
      updateReportDto.daletedFileIds.map((deletedFileId) => this.softDeleteFile(deletedFileId)),
    )

    // Upload new files
    await this.uploadFiles(report.campaignId, reportId, userId, newPhotos, newDocuments)
  }

  async softDeleteReport(reportId: string): Promise<CampaignReport> {
    return this.prisma.campaignReport.update({
      where: {
        id: reportId,
      },
      data: {
        isDeleted: { set: true },
      },
    })
  }

  private async softDeleteFile(fileId: string): Promise<CampaignReportFile> {
    return this.prisma.campaignReportFile.update({
      where: {
        id: fileId,
      },
      data: {
        isDeleted: true,
      },
    })
  }

  private async uploadFiles(
    campaignId: string,
    reportId: string,
    userId: string,
    photos: Express.Multer.File[],
    documents: Express.Multer.File[],
  ) {
    // Insert file records in database
    const fileDatabaseRecords = await this.createFileRecords(photos, documents, reportId, userId)

    // Upload files to storage
    await Promise.all(
      fileDatabaseRecords.map((fileRecord) =>
        this.s3.uploadObject(
          this.bucketName,
          fileRecord.id,
          encodeURIComponent(fileRecord.filename),
          fileRecord.mimetype,
          fileRecord.buffer,
          'CampaignReport',
          campaignId,
          userId,
        ),
      ),
    )
  }

  private async createFileRecords(
    photos: Express.Multer.File[],
    documents: Express.Multer.File[],
    reportId: string,
    userId: string,
  ) {
    const toFileDto = (file: Express.Multer.File) => ({
      reportId,
      filename: file.filename,
      mimetype: file.mimetype,
      personId: userId,
    })

    const insertInDatabase = async (
      fileType: CampaignReportFileType,
      files: Express.Multer.File[],
    ) => {
      return Promise.all(
        files.map(async (file) => {
          const databaseRecord = await this.prisma.campaignReportFile.create({
            data: {
              ...toFileDto(file),
              type: fileType,
            },
          })
          return {
            ...file,
            type: databaseRecord.type,
            id: databaseRecord.id,
          }
        }),
      )
    }

    const photoRecords = await insertInDatabase(CampaignReportFileType.photo, photos)
    const documentRecords = await insertInDatabase(CampaignReportFileType.document, documents)
    return [...photoRecords, ...documentRecords]
  }
}
