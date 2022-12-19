import { Country } from '.prisma/client'
import { countryFactory } from './factory'

/**
 * List with pre-defined default Countries
 */

export const countryBulgaria: Country = countryFactory.build({
  name: 'Bulgaria',
  countryCode: 'BG',
})
