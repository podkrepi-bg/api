import { Prisma } from '@prisma/client'
import { donationWithPerson } from '../queries/donation.validator'

export type PaymentWithDonation = Prisma.PaymentGetPayload<{ include: { donations: true } }>
export type DonationWithPerson = Prisma.DonationGetPayload<{ include: { person: true } }>
export type DonationWithPersonAndVault = Prisma.DonationGetPayload<typeof donationWithPerson>
export type PaymentWithDonationCount = Prisma.PaymentGetPayload<{
  include: {
    _count: {
      select: {
        donations: true
      }
    }
  }
}>
