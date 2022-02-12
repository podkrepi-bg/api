import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { City } from '@prisma/client'
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

  @Get('view/:id')
  @Public()
  async viewTown(@Param('id') id: string) {
    return await this.cityService.viewCity(id)
  }

  @Post('create')
  @Public()
  async createTown(@Body() body: City) {
    return await this.cityService.createCity(body)
  }

  @Put('edit/:id')
  @Public()
  async editTown(@Param('id') id: string, @Body() body: City) {
    return await this.cityService.editCity(id, body)
  }

  @Delete('remove/:id')
  @Public()
  async removeTown(@Param('id') id: string) {
    return await this.cityService.removeCity(id)
  }

  @Get('/search/name/:key')
  @Public()
  async searchByName(@Param('key') key: string) {
    return await this.cityService.searchByName(key)
  }

  @Get('/search/country/:key')
  @Public()
  async searchByCountry(@Param('key') key: string) {
    return await this.cityService.searchByCountry(key)
  }

  @Post('deletemany')
  @Public()
  removeMany(@Body() itemsToDelete: [string]) {
    return this.cityService.removeMany(itemsToDelete)
  }
}
