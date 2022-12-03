import { PartialType } from '@nestjs/swagger'
import { CreateReportDto } from './create-report.dto'

export class ReportFileDto {
  filename: string
  mimetype: string
  id: string
}

export class GetReportDto extends PartialType(CreateReportDto) {
  photos: ReportFileDto[]
  documents: ReportFileDto[]
}
