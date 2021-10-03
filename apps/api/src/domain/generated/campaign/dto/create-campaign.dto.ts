import { Prisma } from '@prisma/client'

export class CreateCampaignDto {
  slug: string
  title: string
  essence: string
  coordinatorId: string
  description?: string
  targetAmount?: Prisma.Decimal
  reachedAmount?: Prisma.Decimal
  startDate?: Date
  endDate?: Date
  deletedAt?: Date
}
