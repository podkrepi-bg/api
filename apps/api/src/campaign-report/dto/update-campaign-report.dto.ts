// import { PartialType } from '@nestjs/swagger';
// import { CreateCampaignReportDto } from './create-campaign-report.dto';

// export class UpdateCampaignReportDto extends PartialType(CreateCampaignReportDto) {}
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { UpdatePersonDto } from '../../person/dto/update-person.dto'
import { NotifierType, Prisma, ReportReason, ReportStatus } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator'

@Expose()
export class UpdateCampaignReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdatePersonDto)
  public readonly person: UpdatePersonDto

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  public readonly campaignId: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  public readonly personId: string

  @ApiProperty()
  @Expose()
  @IsString()
  public readonly reportContent: string

  @Expose()
  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason, { context: ReportReason })
  public readonly reason: ReportReason

  @Expose()
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus, { context: ReportStatus })
  public readonly status: ReportStatus

  @Expose()
  @ApiProperty({ enum: NotifierType })
  @IsEnum(NotifierType, { context: NotifierType })
  public readonly notifierType: NotifierType

  public toEntity(): Prisma.CampaignReportCreateInput {
    return {
      notifierType: this.notifierType,
      reason: this.reason,
      status: this.status,
      reportContent: this.reportContent,
      campaign: { connect: { id: this.campaignId } },
      person: { connect: { id: this.personId } },
    }
  }
}
