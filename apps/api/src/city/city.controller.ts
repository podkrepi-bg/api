import { Controller, Get } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'

import { CityService } from './city.service'

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get('list')
  @Public()
  async getData() {
    return await this.cityService.listCities()
  }
}
