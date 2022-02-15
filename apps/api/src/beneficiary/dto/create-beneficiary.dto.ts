import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { BeneficiaryType, Prisma } from '.prisma/client'

@Expose()
export class CreateBeneficiaryDto {
  @ApiProperty({ enum: BeneficiaryType })
  type: BeneficiaryType
  personId?: string
  companyId?: string
  coordinatorId: string
  countryCode: string
  cityId: string
  description?: string
  publicData?: Prisma.InputJsonValue
  privateData?: Prisma.InputJsonValue
}
