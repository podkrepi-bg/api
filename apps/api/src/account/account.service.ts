import { Injectable } from '@nestjs/common'
import { Person } from '@prisma/client'
import { UpdatePersonDto } from '../person/dto/update-person.dto'
import { PrismaService } from '../prisma/prisma.service'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { AuthService } from '../auth/auth.service'
import CredentialRepresentation from '@keycloak/keycloak-admin-client/lib/defs/credentialRepresentation'

@Injectable()
export class AccountService {
  constructor(private prismaService: PrismaService, private authService: AuthService) {}

  async updateUserProfile(
    user: KeycloakTokenParsed,
    data: UpdatePersonDto,
  ): Promise<Person | null> {
    await this.authService.updateKeycloakUser(user.sub as string, data)
    return await this.prismaService.person.update({ where: { keycloakId: user.sub }, data:{
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      birthday: data.birthday,
    } })
  }

  async updateUserPassword(
    user: KeycloakTokenParsed,
    data: CredentialRepresentation,
  ): Promise<boolean> {
    return await this.authService.updateKeycloakUserPassword(user.sub as string, data)
  }

  async disableUser(user: KeycloakTokenParsed) {
    return await this.authService.disableKeycloakUser(user.sub as string)
  }
}
