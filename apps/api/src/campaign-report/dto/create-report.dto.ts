import { ApiProperty } from '@nestjs/swagger/dist/decorators'
import { Expose } from 'class-transformer'
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator'
import { CreateCampaignFileDto } from '../../campaign-file/dto/create-campaign-file.dto'

@Expose()
export class CreateReportDto {
  @ApiProperty()
  @Expose()
  @IsDate()
  startDate: Date

  @ApiProperty()
  @Expose()
  @IsDate()
  endDate: Date

  @ApiProperty()
  @Expose()
  @IsString()
  description: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  photos: CreateCampaignFileDto[]

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsNumber()
  totalFunds: number

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsNumber()
  fundsForPeriod: number

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsNumber()
  spentFundsForPeriod: number

  @ApiProperty()
  @Expose()
  @IsString()
  goals: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  documents: CreateCampaignFileDto[]

  @ApiProperty()
  @Expose()
  @IsString()
  nextSteps: string


  @ApiProperty()
  @Expose()
  @IsString()
  additionalInfo: string
}
