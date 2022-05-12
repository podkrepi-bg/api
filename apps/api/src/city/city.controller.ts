import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { City } from '@prisma/client'
import { Public } from 'nest-keycloak-connect'
import { CityService } from './city.service'
import { CreateCityDto } from './dto/create-city.dto'
import { UpdateCityDto } from './dto/update-city.dto'

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get('list')
  @Public()
  async findAll(): Promise<City[]> {
    return await this.cityService.findAll()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string): Promise<City> {
    return this.cityService.findOne(id)
  }

  @Post('create')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async create(@Body() createCityDto: CreateCityDto): Promise<City> {
    return await this.cityService.create(createCityDto)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto): Promise<City> {
    return this.cityService.update(id, updateCityDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string): Promise<City> {
    return this.cityService.remove(id)
  }
}
