import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'

import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(private config: ConfigService, private admin: KeycloakAdminClient) {}

  async login(loginDto: LoginDto) {
    try {
      await this.admin.auth({
        clientId: this.config.get<string>('keycloak.clientId') || '',
        clientSecret: this.config.get<string>('keycloak.secret') || '',
        grantType: 'password',
        username: loginDto.email,
        password: loginDto.password,
      })
      const jwt = this.admin.accessToken
      return { jwt }
    } catch (error) {
      const response = {
        error: error.message,
        data: error.response.data,
      }
      console.error(response)
      return response
    }
  }

  async createUser(registerDto: RegisterDto) {
    console.log(this.admin)
    console.log(this.config.get<string>('keycloak.clientId'))
    try {
      await this.admin.auth({
        grantType: 'client_credentials',
        clientId: this.config.get<string>('keycloak.clientId') || '',
        clientSecret: this.config.get<string>('keycloak.secret') || '',
      })
      return await this.admin.users.create({
        username: registerDto.email,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        enabled: true,
        credentials: [{ type: 'password', value: registerDto.password }],
      })
    } catch (error) {
      const response = {
        error: error.message,
        data: error.response.data,
      }
      console.error(response)
      return response
    }
  }
}
