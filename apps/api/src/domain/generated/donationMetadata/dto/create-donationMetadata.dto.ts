import { Prisma } from '@prisma/client'

export class CreateDonationMetadataDto {
  name?: string
  extraData?: Prisma.InputJsonValue
}
