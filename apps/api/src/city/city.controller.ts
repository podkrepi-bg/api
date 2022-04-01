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
  async findAll() {
    return await this.cityService.findAll()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.cityService.findOne(id)
  }

  @Post('create')
  async create(@Body() CreateCityDto: CreateCityDto) {
    return await this.cityService.create(CreateCityDto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.cityService.update(id, updateCityDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cityService.remove(id)
  }
}
