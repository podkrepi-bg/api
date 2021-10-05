import { Injectable } from '@nestjs/common'
import KcAdminClient from '@keycloak/keycloak-admin-client'
import { ConfigService } from '@nestjs/config'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
@Injectable()
export class AuthService {
  private admin: KcAdminClient

  constructor(private config: ConfigService) {
    this.admin = new KcAdminClient({
      baseUrl: config.get<string>('keycloak.serverUrl'),
      realmName: config.get<string>('keycloak.realm'),
    })
  }

  async login(loginDto: LoginDto) {
    try {
      await this.admin.auth({
        clientId: this.config.get<string>('keycloak.clientId') || '',
        grantType: 'password',
        username: loginDto.email,
        password: loginDto.password,
      })
      return { jwt: 'xxxx' }
    } catch (error) {
      console.error(error)
      return { error: error.message }
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
        credentials: [{ type: 'password', value: registerDto.password }],
      })
    } catch (error) {
      console.error(error.message)
    }
  }
}
