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
    payment: {
      select: {
        id: true,
        status: true,
        provider: true,
        currency: true,
        billingEmail: true,
        billingName: true,
      },
    },
    targetVault: {
      select: {
        name: true,
        campaign: {
          select: {
            id: true,
          },
        },
      },
    },
    metadata: true,
  },
})
