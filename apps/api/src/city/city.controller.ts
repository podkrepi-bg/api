import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'

import { CityService } from './city.service'
import { CreateCityDto } from './dto/create-city.dto'
import { UpdateCityDto } from './dto/update-city.dto'
@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get('list')
  @Public()
  async getData() {
    return await this.cityService.listCities()
  }

  @Get('list-one/:id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.cityService.listCity(id)
  }

  @Post('create-city')
  @Public()
  async create(@Body() CreateCityDto: CreateCityDto) {
    return await this.cityService.createCity(CreateCityDto)
  }

  @Patch('update-one/:id')
  @Public()
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.cityService.updateCity(id, updateCityDto)
  }

  @Delete('delete-one/:id')
  @Public()
  remove(@Param('id') id: string) {
    return this.cityService.removeCity(id)
  }
}
