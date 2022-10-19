import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

import { CountryService } from './country.service'
import { CreateCountryDto } from './dto/create-country.dto'
import { UpdateCountryDto } from './dto/update-country.dto'
import { ApiTags } from '@nestjs/swagger';

@ApiTags('country')
@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post('create-country')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  create(@Body() createCountryDto: CreateCountryDto) {
    return this.countryService.create(createCountryDto)
  }

  @Get('list')
  @Public()
  findAll() {
    return this.countryService.listCountries()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.countryService.getCountryById(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() updateCountryDto: UpdateCountryDto) {
    return this.countryService.updateCountryById(id, updateCountryDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.countryService.removeCountryById(id)
  }
}
