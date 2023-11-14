import { Prisma } from '@prisma/client'
import { Donation } from '../../donation/entities/donation.entity'

export class DonationMetadata {
  donationId: string
  name: string | null
  createdAt: Date
  extraData: Prisma.JsonValue | null
  donation?: Donation
}
