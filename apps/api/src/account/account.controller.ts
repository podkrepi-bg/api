import { Body, Controller, Get, Put, Logger } from '@nestjs/common'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { Person } from '../domain/generated/person/entities'
import { UpdatePersonDto } from '../person/dto/update-person.dto'
import { PersonService } from '../person/person.service'
import { AccountService } from './account.service'

@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly personService: PersonService,
  ) {}

  @Get('me')
  @Public(false)
  async getMe(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
  ) {
    if (user) {
      return {
        user: await this.personService.findOneByKeycloakId(user.sub as string),
      }
    }
    return { status: 'unauthenticated' }
  }

  @Put('me')
  async updateProfile(
    @AuthenticatedUser() user: KeycloakTokenParsed,
    @Body() data: UpdatePersonDto,
  ) {
    return await this.accountService.updateUserProfile(user.sub as string, data)
  }

  @Get('new')
  async register(@AuthenticatedUser() user: KeycloakTokenParsed) {
    let person: Person | null = null
    try {
      person = await this.personService.create({
        firstName: user.given_name as string,
        lastName: user.family_name as string,
        email: user.email as string,
        keycloakId: user.sub,
      })
    } catch (err) {
      Logger.warn(`Failed to create person for registered user with keycloakId ${user.sub}`)
    }

    return {
      user: person,
    }
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
