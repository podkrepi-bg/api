import { Body, Controller, Post } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'

@Controller('register')
@Resource('register')
export class RegisterController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @Public()
  @Scopes('view')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.createUser(registerDto)
  }
}
