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

  @Get(':slug')
  @Public()
  findOne(@Param('slug') slug: string) {
    return this.countryService.getCountryById(slug)
  }

  @Patch(':slug')
  @Public()
  update(@Param('slug') slug: string, @Body() updateCountryDto: UpdateCountryDto) {
    return this.countryService.update(slug, updateCountryDto)
  }

  @Delete(':slug')
  @Public()
  remove(@Param('slug') slug: string) {
    return this.countryService.remove(slug)
  }
}
