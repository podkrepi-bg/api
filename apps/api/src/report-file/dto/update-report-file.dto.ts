import { PartialType } from '@nestjs/swagger'
import { CreateReportFileDto } from './create-report-file.dto'

export class UpdateReportFileDto extends PartialType(CreateReportFileDto) {}
