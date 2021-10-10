import { Body, Controller, Post } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'

import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

@Controller('login')
@Resource('login')
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @Public()
  @Scopes('view')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto)
  }
}
