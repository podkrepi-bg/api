import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthenticatedUser, Public } from 'nest-keycloak-connect'

import { KeycloakTokenParsed } from '../auth/keycloak'

import { CountryService } from './country.service'
import { CreateCountryDto } from './dto/create-country.dto'
import { UpdateCountryDto } from './dto/update-country.dto'

@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post('create-country')
  create(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Body()
    createCountryDto: CreateCountryDto,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

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
  update(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Param('id')
    id: string,
    @Body() updateCountryDto: UpdateCountryDto,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.countryService.updateCountryById(id, updateCountryDto)
  }

  @Delete(':id')
  remove(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Param('id')
    id: string,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.countryService.removeCountryById(id)
  }
}
