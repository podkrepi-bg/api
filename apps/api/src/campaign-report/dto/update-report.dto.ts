import { ApiProperty, PartialType } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsArray } from 'class-validator'
import { CreateReportDto } from './create-report.dto'

export class UpdateReportDto extends PartialType(CreateReportDto) {
  @Expose()
  @ApiProperty()
  @IsArray({ each: true })
  @Type(() => String)
  daletedFileIds: string[]
}
