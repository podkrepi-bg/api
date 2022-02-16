import { Expose } from 'class-transformer'
import { BeneficiaryType, Prisma } from '.prisma/client'

@Expose()
export class CreateBeneficiaryDto {
  // @ApiProperty({ enum: BeneficiaryType })
  type: BeneficiaryType
  // @ApiProperty()
  personId?: string
  // @ApiProperty()
  companyId?: string
  // @ApiProperty()
  coordinatorId: string
  // @ApiProperty()
  countryCode: string
  // @ApiProperty()
  cityId: string
  // @ApiProperty()
  description?: string
  // @ApiProperty()
  publicData?: Prisma.InputJsonValue
  // @ApiProperty()
  privateData?: Prisma.InputJsonValue
}
