export class CreatePersonDto {
  firstName: string
  lastName: string
  email: string
  emailConfirmed?: boolean
  phone?: string
  company?: string
  newsletter?: boolean
  address?: string
  birthday?: Date
  personalNumber?: string
  keycloakId?: string
}
