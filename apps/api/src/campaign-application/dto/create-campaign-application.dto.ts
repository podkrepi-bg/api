import { ApiProperty } from '@nestjs/swagger'
import { CampaignTypeCategory, Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

@Expose()
export class CreateCampaignApplicationDto {
  /**
   * What would the campaign be called. ('Help Vesko' or 'Castrate Plovdiv Cats')
   */
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  @IsString()
  campaignName: string

  /** user needs to agree to this as a prerequisite to creating a campaign application */
  @ApiProperty()
  @Expose()
  @IsBoolean()
  acceptTermsAndConditions: boolean

  /** user needs to agree to this as a prerequisite to creating a campaign application */
  @ApiProperty()
  @Expose()
  @IsBoolean()
  transparencyTermsAccepted: boolean

  /** user needs to agree to this as a prerequisite to creating a campaign application */
  @ApiProperty()
  @Expose()
  @IsBoolean()
  personalInformationProcessingAccepted: boolean

  /** Who is organizing this campaign */
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  @IsString()
  organizerName: string

  /** Contact Email to use for the Campaign Application process i.e. if more documents or other info are requested */
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  @IsString()
  organizerEmail: string

  /** Contact Email to use for the Campaign Application process i.e. if more documents or other info are requested */
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  @IsString()
  organizerPhone: string

  /** Who will benefit and use the collected donations */
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  @IsString()
  beneficiary: string

  /** What is the relationship between the Organizer and the Beneficiary ('They're my elderly relative and I'm helping with the internet-computer stuff') */
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  @IsString()
  organizerBeneficiaryRel: string

  /** What is the result that the collected donations will help achieve */
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  @IsString()
  goal: string

  /** What if anything has been done so far */
  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  history?: string

  /** How much would the campaign be looking for i.e '10000lv or 5000 Eur or $5000' */
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  @IsString()
  amount: string

  /** Describe the goal of the campaign in more details */
  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  description?: string

  /** Describe public figures that will back the campaign and help popularize it. */
  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  campaignGuarantee?: string

  /** If any - describe what other sources were used to gather funds for the goal */
  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  otherFinanceSources?: string

  /** Anything that the operator needs to know about the campaign */
  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  otherNotes?: string

  @ApiProperty({ enum: CampaignTypeCategory })
  @Expose()
  @IsOptional()
  category?: CampaignTypeCategory

  public toEntity(): Prisma.CampaignApplicationCreateInput {
    return {
      ...this,
    }
  }
}
