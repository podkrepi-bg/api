import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { CountryService } from './country.service'
import { CreateCountryDto } from './dto/create-country.dto'
import { UpdateCountryDto } from './dto/update-country.dto'

@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post()
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
    return this.countryService.findOne(+id)
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateCountryDto: UpdateCountryDto) {
    return this.countryService.update(+id, updateCountryDto)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.countryService.remove(+id)
  }
}
