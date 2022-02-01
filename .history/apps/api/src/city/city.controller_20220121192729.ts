import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'

import { CityService } from './city.service'
import { CreateCityDto } from './dto/create-city.dto'

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get('list')
  @Public()
  async getData() {
    return await this.cityService.listCities()
  }

  @Post('create-city')
  @Public()
  async create(@Body() createDto: CreateCityDto) {
    return await this.cityService.createCity(createDto)
  }
}
