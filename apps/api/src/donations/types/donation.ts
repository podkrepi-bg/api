import { Prisma } from '@prisma/client'

export type PaymentWithDonation = Prisma.PaymentsGetPayload<{ include: { donations: true } }>
export type DonationWithPerson = Prisma.DonationGetPayload<{ include: { person: true } }>
