import { Person } from '../../person/entities'
import { Campaign } from '../../campaign/entities'

export class Organizer {
  id: string
  personId: string
  createdAt: Date
  updatedAt: Date | null
  person?: Person
  campaigns?: Campaign[]
}
