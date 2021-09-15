import { Controller, Get } from '@nestjs/common'
import {
  AuthenticatedUser,
  Public,
  Resource,
  RoleMatchingMode,
  Roles,
  Scopes,
} from 'nest-keycloak-connect'

import { AccountService } from './account.service'

interface KeycloakTokenParsed extends KeycloakProfile {
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

@Controller('account')
@Resource('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('me')
  @Public(false)
  @Scopes()
  getHello(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
  ) {
    if (user) {
      // Public authenticated
      console.log(user)
      return { status: 'authenticated', user }
    }
    // Public
    return { status: 'unauthenticated' }
  }

  @Get('private')
  @Scopes()
  getPrivate(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
  ) {
    console.log(user)
    return { message: 'Authenticated only!', ...user }
  }

  @Get('admin')
  @Roles({ roles: ['view-profile', 'manage-account'], mode: RoleMatchingMode.ANY })
  adminRole() {
    return 'Admin only!'
  }
}
