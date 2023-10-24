import { Body, ConflictException, Controller, Post } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'
import { AuthService } from './auth.service'
import { RegisterDto, ProfileType } from './dto/register.dto'
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

  @Post()
  @Public()
  @Scopes('view')
  async register(@Body() registerDto: RegisterDto) {
    const isCorporateReg = registerDto.type === ProfileType.CORPORATE
    if (isCorporateReg) {
      const company = await this.companyService.findOneByEIK(registerDto.companyNumber)
      if (company) throw new ConflictException('Company with this EIK already exists')
    }
    return await this.authService.createUser(registerDto, isCorporateReg)
  }
}
