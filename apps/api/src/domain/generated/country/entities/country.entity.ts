import { City } from '../../city/entities/city.entity'

export class Country {
  slug: string
  name: string
  countryCode: string
  cities?: City[]
}
