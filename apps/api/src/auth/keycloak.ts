import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

export function isAdmin(user: KeycloakTokenParsed): boolean {
  if (!user.resource_access) {
    return false
  }

  const roles = [RealmViewSupporters.role, ViewSupporters.role].map((role) => {
    const [key, roleName] = role.split(':')
    return {
      key,
      value: roleName,
    }
  })

  return roles.some((role) => {
    const userRoles = (user.resource_access as KeycloakResourceAccess)[role.key]
    return userRoles ? userRoles.roles.includes(role.value) : false
  })
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
