import { Logger } from '@nestjs/common'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

export function isAdmin(user: KeycloakTokenParsed): boolean {
  Logger.debug('User info: ' + JSON.stringify(user))

  if (!(user.resource_access || user.realm_access)) {
    return false
  }

  const adminRoles = [RealmViewSupporters.role, ViewSupporters.role].map((role) => {
    const [key, roleName] = role.split(':')
    return {
      key,
      value: roleName,
    }
  })

  return adminRoles.some((role) => {
    Logger.debug('checking for role: ' + role.value)

    const isResourceAdminRole = user.resource_access?.account?.roles
      ? user.resource_access.account.roles.includes(role.value)
      : false
    const isRealmAdminRole = user.realm_access?.roles
      ? user.realm_access.roles.includes(role.value)
      : false

    if (isResourceAdminRole) Logger.debug('User is resource admin and matched role: ' + role.value)

    if (isRealmAdminRole) Logger.debug('User is realm admin and matched role: ' + role.value)

    return isResourceAdminRole || isRealmAdminRole
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
