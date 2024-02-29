import { Prisma } from '@prisma/client'

export type AffiliateWithDonation = Prisma.AffiliateGetPayload<{
  include: { payments: { include: { donations: true } } }
}>

export type AffiliateWithCompanyPayload = Prisma.AffiliateGetPayload<{
  include: { company: { include: { person: true } }; donations: true }
}>
