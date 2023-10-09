import { Body, Controller, Post } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'
import { AuthService } from './auth.service'
import { CompanyRegisterDto, RegisterDto } from './dto/register.dto'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('register')
@Controller('register')
@Resource('register')
export class RegisterController {
  constructor(private readonly authService: AuthService) {}

  @Post('individual')
  @Public()
  @Scopes('view')
  async registerIndividual(@Body() registerDto: RegisterDto) {
    return await this.authService.createUser(registerDto)
  }
  @Post('corporate')
  @Public()
  @Scopes('view')
  async registerCorporate(@Body() registerDto: CompanyRegisterDto) {
    return await this.authService.createUser(registerDto, true)
  }
}
