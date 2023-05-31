import { Prisma } from '@prisma/client'

export const donationWithPerson = Prisma.validator<Prisma.DonationFindManyArgs>()({
  include: {
    person: {
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    targetVault: {
      select: {
        name: true,
        campaign: {
          select: {
            id: true
          }
        }
      },
    },
  },
})

export type DonationWithPerson = Prisma.DonationGetPayload<typeof donationWithPerson>
