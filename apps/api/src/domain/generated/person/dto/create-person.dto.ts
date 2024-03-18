export class CreatePersonDto {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  newsletter?: boolean
  helpUsImporve?: boolean
  address?: string
  birthday?: Date
  emailConfirmed?: boolean
  personalNumber?: string
  keycloakId?: string
  stripeCustomerId?: string
  picture?: string
}
