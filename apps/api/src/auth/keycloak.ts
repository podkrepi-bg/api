import { CreateInfoRequestDto } from "../info-request/dto/create-info-request.dto";

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
  sid: string
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
