import { Person } from '@prisma/client'

export class Benefactor {
  id: string
  personId: string
  extCustomerId: string | null
  createdAt: Date
  updatedAt: Date | null
  person?: Person
}
