import CredentialRepresentation from '@keycloak/keycloak-admin-client/lib/defs/credentialRepresentation'
import { Body, Controller, Get, Put, Logger, Delete, Patch, Param } from '@nestjs/common'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { Person } from '../domain/generated/person/entities'
import { UpdatePersonDto } from '../person/dto/update-person.dto'
import { PersonService } from '../person/person.service'
import { AccountService } from './account.service'
import { ApiTags } from '@nestjs/swagger'

@Controller('account')
@ApiTags('account')
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
        user: await this.personService.findOneByKeycloakId(user.sub),
      }
    }
    return { status: 'unauthenticated' }
  }

  @Put('me')
  async updateProfile(
    @AuthenticatedUser() user: KeycloakTokenParsed,
    @Body() data: UpdatePersonDto,
  ) {
    let person: Person | null = null
    try {
      person = await this.accountService.updateUserProfile(user, data)
    } catch (err) {
      Logger.error(`Failed to update user with keycloakId ${user.sub}. Error is: ${err}`)
      throw err
    }

    return {
      user: person,
    }
  }

  @Put('me/credentials')
  async updatePassword(
    @AuthenticatedUser() user: KeycloakTokenParsed,
    @Body() data: CredentialRepresentation,
  ) {
    let hasSucceeded = false
    try {
      hasSucceeded = await this.accountService.updateUserPassword(user, data)
    } catch (err) {
      Logger.error(`Failed to update user with keycloakId ${user.sub}. Error is: ${err}`)
      throw err
    }

    return {
      updated: hasSucceeded,
    }
  }

  @Delete('me')
  async deleteUser(@AuthenticatedUser() user: KeycloakTokenParsed) {
    try {
      return await this.accountService.deleteUser(user)
    } catch (err) {
      Logger.error(`Failed to delete user with keycloakId ${user.sub}. Error is: ${err}`)
      throw err
    }
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

  @Patch(':keycloakId/status')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async changeProfileStatus(
    @Param('keycloakId') keycloakId: string,
    @Body() data: UpdatePersonDto,
  ) {
    return await this.accountService.changeProfileActivationStatus(
      keycloakId,
      !!data.profileEnabled,
    )
  }
}
