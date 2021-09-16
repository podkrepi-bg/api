import { Controller, Get } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'

import { CityService } from './city.service'

@Controller('city')
@Resource('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get('list')
  @Public()
  @Scopes()
  async getData() {
    return await this.cityService.listCities()
  }
}
