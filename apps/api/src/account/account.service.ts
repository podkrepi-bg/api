import { Injectable } from '@nestjs/common'
import { Person } from '@prisma/client'
import { UpdatePersonDto } from '../person/dto/update-person.dto'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { AuthService } from '../auth/auth.service'
import CredentialRepresentation from '@keycloak/keycloak-admin-client/lib/defs/credentialRepresentation'

@Injectable()
export class AccountService {
  constructor(private authService: AuthService) {}

  async updateUserProfile(
    user: KeycloakTokenParsed,
    data: UpdatePersonDto,
  ): Promise<Person | null> {
    return await this.authService.updateUser(user.sub as string, data)
  }

  async updateUserPassword(
    user: KeycloakTokenParsed,
    data: CredentialRepresentation,
  ): Promise<boolean> {
    return await this.authService.updateUserPassword(user.sub as string, data)
  }

  async disableUser(user: KeycloakTokenParsed) {
    return await this.authService.disableUser(user.sub as string)
  }
}
