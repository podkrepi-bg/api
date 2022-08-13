import { Body, Controller, Post } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'

import { AuthService } from './auth.service'
import { ForgottenPasswordEmailDto } from './dto/forgot-password.dto'
import { LoginDto } from './dto/login.dto'
import { NewPasswordDto } from './dto/recovery-password.dto'

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

  @Post('/forgot-password')
  @Public()
  async forgotPassword(@Body() forgotPasswordDto: ForgottenPasswordEmailDto) {
    return await this.authService.sendMailForPasswordChange(forgotPasswordDto)
  }
  @Post('/reset-password')
  @Public()
  async recoveryPassword(@Body() RecoveryPasswordDto: NewPasswordDto) {
    return await this.authService.updateForgottenPassword(RecoveryPasswordDto)
  }
}
