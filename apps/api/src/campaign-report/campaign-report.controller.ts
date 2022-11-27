import { Body, Controller, Delete, Get, Param, Post, Put, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { CreateReportDto } from "./dto/create-report.dto";

@ApiTags('campaign-report')
@Controller('campaign')
export class CampaignReportController {
  constructor() {}

  @Get(':campaignId/reports')
  async getReports(@Param('campaignId') campaignId: number): Promise<void> {

  }

  @Get(':campaignId/reports/:reportId')
  async getReport(@Param('campaignId') campaignId: number, @Param('reportId') reportId: number): Promise<void> { 

  }

  @Post(':campaignId/reports')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'photos', maxCount: 5 },
    { name: 'documents', maxCount: 5 },
  ], {
    limits: {
      fileSize: 1024 * 1024 * 10
    }
  }))
  async addReport(
    @Param('campaignId') campaignId: number,
    @UploadedFiles() files: { photos?: Express.Multer.File[], documents?: Express.Multer.File[] },
    @Body() report: CreateReportDto) {
      console.log('documents', files.documents);
      console.log('photos', files.photos);
      
  }

  @Put(':/campaignId/reports/:reportId')
  async updateReport(
    @Param('campaignId') campaignId: number,
    @Param('reportId') reportId: number,
    @Body() updatedReport: any) {

  }

  @Delete(':campaignId/reports/:reportId')
  async deleteReport(@Param('campaignId') campaignId: number, @Param('reportId') reportId: number) {

  }
}