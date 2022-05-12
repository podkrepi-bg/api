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
import { AuthenticatedUser, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

import { KeycloakTokenParsed } from '../auth/keycloak'

import { CompanyService } from './company.service'
import { CreateCompanyDto } from './dto/create-company.dto'
import { UpdateCompanyDto } from './dto/update-company.dto'

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('/create-company')
  create(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.companyService.create(createCompanyDto)
  }

  @Get('/list')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.companyService.findAll()
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findOne(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Param('id') id: string,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.companyService.findOne(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.companyService.update(id, updateCompanyDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Param('id') id: string,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.companyService.remove(id)
  }
}
