import { ApiProperty } from '@nestjs/swagger/dist/decorators'
import { Prisma } from '@prisma/client'
import { Expose, Type } from 'class-transformer'
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator'

@Expose()
export class CreateReportDto {
  @ApiProperty()
  @Expose()
  @IsDate()
  @Type(() => Date)
  startDate: Date

  @ApiProperty()
  @Expose()
  @IsDate()
  @Type(() => Date)
  endDate: Date

  @ApiProperty()
  @Expose()
  @IsString()
  description: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsNumber()
  totalFunds?: number

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsNumber()
  fundsForPeriod?: number

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsNumber()
  spentFundsForPeriod?: number

  @ApiProperty()
  @Expose()
  @IsString()
  goals: string

  @ApiProperty()
  @Expose()
  @IsString()
  nextSteps: string

  @ApiProperty()
  @Expose()
  @IsString()
  additionalInfo: string

  public toEntity(campaignId: string, creatorId: string): Prisma.CampaignReportCreateInput {
    return {
      campaign: { connect: { id: campaignId } },
      startDate: this.startDate,
      endDate: this.endDate,
      description: this.description,
      files: undefined,
      creator: { connect: { id: creatorId } },
      totalFunds: this.totalFunds,
      fundsForPeriod: this.fundsForPeriod,
      spentFundsForPeriod: this.spentFundsForPeriod,
      goals: this.goals,
      nextSteps: this.nextSteps,
      additionalInfo: this.additionalInfo,
    }
  }
}
