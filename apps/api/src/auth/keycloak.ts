import { RealmViewSupporters } from '@podkrepi-bg/podkrepi-types'

export function isAdmin(user: KeycloakTokenParsed): boolean {
  return user.realm_access?.roles.includes(RealmViewSupporters.role) ? true : false
}
export interface KeycloakTokenParsed extends KeycloakProfile {
  exp?: number
  iat?: number
  auth_time?: number
  jti?: string
  iss?: string
  sub?: string
  typ?: string
  azp?: string
  acr?: string
  session_state?: string
  'allowed-origins': string[]
  realm_access?: KeycloakRoles
  resource_access?: KeycloakResourceAccess
  scope?: string
}

interface KeycloakResourceAccess {
  [key: string]: KeycloakRoles
}

interface KeycloakRoles {
  roles: string[]
}

interface KeycloakProfile {
  name?: string
  given_name?: string
  family_name?: string
  email?: string
  email_verified?: string
  preferred_username?: string
}
