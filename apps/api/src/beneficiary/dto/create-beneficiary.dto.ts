import { Prisma } from '.prisma/client'

export class CreateBeneficiaryDto {
  type: string
  personId?: string
  companyId?: string
  coordinatorId: string
  countryCode: string
  cityId: string
  description?: string
  publicData?: Prisma.InputJsonValue
  privateData?: Prisma.InputJsonValue
}
