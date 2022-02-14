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
import { AuthenticatedUser } from 'nest-keycloak-connect'

import { CompanyService } from './company.service'
import { CreateCompanyDto } from './dto/create-company.dto'
import { UpdateCompanyDto } from './dto/update-company.dto'

interface KeycloakTokenParsed extends KeycloakProfile {
  exp?: number
  iat?: number
  auth_time?: number
  jti?: string
  iss?: string
  sub?: string
  typ?: string
  azp?: string
  acr?: string
  session_state?: string
  'allowed-origins': string[]
  realm_access?: KeycloakRoles
  resource_access?: KeycloakResourceAccess
  scope?: string
}
interface KeycloakResourceAccess {
  [key: string]: KeycloakRoles
}
interface KeycloakRoles {
  roles: string[]
}
interface KeycloakProfile {
  name?: string
  given_name?: string
  family_name?: string
  email?: string
  email_verified?: string
  preferred_username?: string
}

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

  @Post('/delete-many')
  removeMany(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Body() idsToDelete: string[],
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.companyService.removeMany(idsToDelete)
  }
}
