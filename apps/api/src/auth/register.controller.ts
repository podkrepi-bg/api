import { Body, ConflictException, Controller, Post } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'
import { AuthService } from './auth.service'
import { CompanyRegisterDto, RegisterDto } from './dto/register.dto'
import { ApiTags } from '@nestjs/swagger'
import { CompanyService } from '../company/company.service'

@ApiTags('register')
@Controller('register')
@Resource('register')
export class RegisterController {
  constructor(
    private readonly authService: AuthService,
    private readonly companyService: CompanyService,
  ) {}

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
    const company = await this.companyService.findOneByEIK(registerDto.companyNumber)
    if (company) throw new ConflictException('Company with this number has been registered already')

    return await this.authService.createUser(registerDto, true)
  }
}
