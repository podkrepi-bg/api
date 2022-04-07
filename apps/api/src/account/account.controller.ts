import { Controller, Get } from '@nestjs/common'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { PersonService } from '../person/person.service'
import { AccountService } from './account.service'

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService, private readonly personService: PersonService) {}

  @Get('me')
  @Public(false)
  async getMe(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
  ) {
    if (user) {
      // Public authenticated
      console.log(user)
      return {
        status: 'authenticated', user, person: await this.personService.findOne(user.sub as string)
      }
    }
    // Public
    return { status: 'unauthenticated' }
  }

  @Get('private')
  getPrivate(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
  ) {
    console.log(user)
    return { message: 'Authenticated only!', ...user }
  }

  @Get('admin')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  adminRole() {
    return { status: 'OK' }
  }
}
