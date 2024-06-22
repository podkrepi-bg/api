import { ApiProperty } from '@nestjs/swagger'
import { Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

@Expose()
export class CreateCampaignApplicationDto {
  @ApiProperty()
  @Expose()
  @IsString()
  title: string

  @ApiProperty()
  @Expose()
  acceptTermsAndConditions: boolean

  @ApiProperty()
  @Expose()
  transparencyTermsAccepted: boolean

  @ApiProperty()
  @Expose()
  personalInformationProcessingAccepted: boolean

  public toEntity(): Prisma.CampaignApplicationCreateInput {
    return {
      campaignName: this.title,
      amount: '',
      beneficiary: '',
      goal: '',
      organizerBeneficiaryRel: '',
      organizerName: '',
      category: 'others',
      organizer: { connect: { id: 'id', personId: '' } },
      documents: { connect: [{ id: '1' }] },
    }
  }
}
