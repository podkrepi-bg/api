import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { CountryService } from './country.service'
import { CreateCountryDto } from './dto/create-country.dto'
import { UpdateCountryDto } from './dto/update-country.dto'

@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post()
  create(@Body() createCountryDto: CreateCountryDto) {
    return this.countryService.create(createCountryDto)
  }

  @Get()
  findAll() {
    return this.countryService.findAll()
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.countryService.findOne(slug)
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() updateCountryDto: UpdateCountryDto) {
    return this.countryService.update(slug, updateCountryDto)
  }

  @Delete(':slug')
  remove(@Param('slug') slug: string) {
    return this.countryService.remove(slug)
  }
}
