import { Injectable, NotFoundException } from '@nestjs/common'
import { CampaignReport } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { ReportFileService } from '../report-file/report-file.service'
import { CreateCampaignReportDto } from './dto/create-campaign-report.dto'
import { UpdateCampaignReportDto } from './dto/update-campaign-report.dto'

@Injectable()
export class CampaignReportService {
  constructor(private prisma: PrismaService, private reportFileService: ReportFileService) {}
  async create(
    inputDto: CreateCampaignReportDto,
  ): Promise<Pick<CampaignReport, 'id' | 'personId'>> {
    const report = await this.prisma.campaignReport.create({ data: inputDto.toEntity() })

    return {
      id: report.id,
      personId: report.personId,
    }
  }

  async update(id: string, updateDto: UpdateCampaignReportDto): Promise<CampaignReport | null> {
    const person = await this.prisma.person.update({
      where: { id: updateDto.personId },
      data: updateDto.person,
    })
    if (!person) throw new NotFoundException('Not found')

    const result = await this.prisma.campaignReport.update({
      where: { id: id },
      data: updateDto.toEntity(),
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async listReports(): Promise<CampaignReport[]> {
    return await this.prisma.campaignReport.findMany({
      include: { person: true, campaign: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getReportById(id: string): Promise<CampaignReport | null> {
    const result = await this.prisma.campaignReport.findUnique({
      where: { id },
      include: { person: true, campaign: true },
    })
    if (!result) throw new NotFoundException('Not found campaign report with ID: ' + id)
    return result
  }

  async removeReportById(id: string): Promise<CampaignReport | null> {
    const files = await this.prisma.reportFile.findMany({
      where: { campaignReportId: id },
    })
    await Promise.all(
      files.map((file) => {
        return this.reportFileService.remove(file.id)
      }),
    )
    const result = await this.prisma.campaignReport.delete({
      where: { id: id },
    })
    if (!result) throw new NotFoundException('Not found campaign report with ID: ' + id)
    console.log('deleted report and files')
    return result
  }
}
