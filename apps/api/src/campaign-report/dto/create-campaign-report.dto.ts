import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { CreatePersonDto } from '@podkrepi-bg/podkrepi-types'
import { Prisma, ReportReason, ReportStatus, NotifierType } from '.prisma/client'
import { IsEnum, IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator'

@Expose()
export class CreateCampaignReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePersonDto)
  public readonly person: CreatePersonDto

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  public readonly campaignId: string

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
      person: {
        connectOrCreate: {
          create: this.person,
          where: { email: this.person.email },
        },
      },
    }
  }
}
