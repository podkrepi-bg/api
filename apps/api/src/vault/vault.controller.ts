import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException } from '@nestjs/common'
import { AuthenticatedUser } from 'nest-keycloak-connect'

import { VaultService } from './vault.service'
import { CreateVaultDto } from './dto/create-vault.dto'
import { UpdateVaultDto } from './dto/update-vault.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'

@Controller('vault')
export class VaultController {
  constructor(private readonly vaultService: VaultService) { }

  @Post()
  create(@AuthenticatedUser() user: KeycloakTokenParsed,
    @Body() createVaultDto: CreateVaultDto) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.vaultService.create(createVaultDto)
  }

  @Get()
  findAll(@AuthenticatedUser() user: KeycloakTokenParsed) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.vaultService.findAll()
  }

  @Get(':id')
  findOne(@AuthenticatedUser() user: KeycloakTokenParsed,
    @Param('id') id: string) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.vaultService.findOne(id)
  }

  @Patch(':id')
  update(@AuthenticatedUser() user: KeycloakTokenParsed,
    @Param('id') id: string, @Body() updateVaultDto: UpdateVaultDto) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.vaultService.update(id, updateVaultDto)
  }

  @Delete(':id')
  remove(@AuthenticatedUser() user: KeycloakTokenParsed,
    @Param('id') id: string) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.vaultService.remove(id)
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

    return this.vaultService.removeMany(idsToDelete)
  }
}
