import { Body, Controller, Post } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { AuthService } from './auth.service'
import { ProviderDto } from './dto/provider.dto'

@Controller('provider-login')
export class ProviderLoginController {
  constructor(private readonly authService: AuthService) {}
  @Post()
  @Public()
  async providerLogin(@Body() providerDto: ProviderDto) {
    return await this.authService.issueTokenFromProvider(providerDto)
  }
}
