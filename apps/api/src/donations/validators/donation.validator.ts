import { Prisma } from '@prisma/client'

export const donationWithPerson = Prisma.validator<Prisma.DonationFindManyArgs>()({
  include: {
    person: {
      select: {
        firstName: true,
        lastName: true,
      },
    },
    targetVault: {
      select: {
        name: true,
      },
    },
  },
})

export type DonationWithPerson = Prisma.DonationGetPayload<typeof donationWithPerson>
