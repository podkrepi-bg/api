import { Prisma, ReportReason, ReportStatus } from '.prisma/client'
import { Expose, Type } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { CreatePersonDto } from '@podkrepi-bg/podkrepi-types'

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

  public toEntity(): Prisma.CampaignReportCreateInput {
    return {
      reason: this.reason,
      status: ReportStatus.initial,
      reportContent: this.reportContent,
      campaign: { connect: { id: this.campaignId } },
      reportedBy: {
        connectOrCreate: {
          create: this.person,
          where: { email: this.person.email },
        },
      },
    }
  }
}
