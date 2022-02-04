import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { CountryService } from './country.service'
import { CreateCountryDto } from './dto/create-country.dto'
import { UpdateCountryDto } from './dto/update-country.dto'

@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post('create-country')
  @Public()
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
  @Public()
  update(@Param('id') id: string, @Body() updateCountryDto: UpdateCountryDto) {
    return this.countryService.updateCountryById(id, updateCountryDto)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.countryService.removeCountryById(id)
  }
}
