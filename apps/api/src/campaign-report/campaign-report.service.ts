import { Injectable } from '@nestjs/common'
import { CampaignReportFileType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { CreateReportDto } from './dto/create-report.dto'
import { ListReportsDto } from './dto/list-reports.dto'

@Injectable()
export class CampaignReportService {
  constructor(private prisma: PrismaService, private s3: S3Service) {}

  private readonly bucketName = 'campaign-report-files'

  async getReports(campaignId: string): Promise<ListReportsDto[]> {
    const dbReports = await this.prisma.campaignReport.findMany({
      where: {
        campaignId,
      },
    })

    return dbReports.map(({ startDate, endDate, description }) => ({
      startDate,
      endDate,
      description,
    }))
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

    const fileDatabaseRecords = await this.createFileRecords(
      photos,
      documents,
      createdReport.id,
      userId,
    )

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

    return Promise.resolve(createdReport.description)
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
