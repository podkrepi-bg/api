import { Body, Controller, Post } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'

import { AuthService } from './auth.service'
import { ForgotPass } from './dto/forgot-password.dto'
import { LoginDto } from './dto/login.dto'
import { RecoveryPasswordDto } from './dto/recovery-password.dto'

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
  async forgotPassword(@Body() forgotPasswordDto: ForgotPass) {
    return await this.authService.forgotPass(forgotPasswordDto)
  }
  @Post('/recovery-password')
  @Public()
  async recoveryPassword(@Body() RecoveryPasswordDto: RecoveryPasswordDto) {
    return await this.authService.recoveryPass(RecoveryPasswordDto)
  }
}
