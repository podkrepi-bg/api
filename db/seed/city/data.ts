import { City } from '.prisma/client'
import { cityFactory } from './factory'

/**
 * List with pre-defined default Cities
 */

export const citySofia = (countryId: string): City => {
  return cityFactory.build(
    {
      name: 'Sofia',
      postalCode: '1000',
    },
    { associations: { countryId } },
  )
}

export const cityPlovdiv = (countryId: string): City => {
  return cityFactory.build(
    {
      name: 'Plovdiv',
      postalCode: '4000',
    },
    { associations: { countryId } },
  )
}

export const cityVarna = (countryId: string): City => {
  return cityFactory.build(
    {
      name: 'Varna',
      postalCode: '9000',
    },
    { associations: { countryId } },
  )
}
