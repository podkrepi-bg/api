import { Controller, Get } from '@nestjs/common';

import { CityService } from './city.service';

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  getData() {
    return this.cityService.listCities();
  }
}
