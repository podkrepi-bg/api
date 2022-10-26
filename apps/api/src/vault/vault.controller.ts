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
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { AuthenticatedUser, RoleMatchingMode, Roles } from 'nest-keycloak-connect'

import { VaultService } from './vault.service'
import { CampaignService } from '../campaign/campaign.service'
import { CreateVaultDto } from './dto/create-vault.dto'
import { UpdateVaultDto } from './dto/update-vault.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { ApiTags } from '@nestjs/swagger';

@ApiTags('vault')
@Controller('vault')
export class VaultController {
  constructor(
    private readonly vaultService: VaultService,
    private readonly campaignService: CampaignService,
  ) {}

  @Post()
  async create(
    @AuthenticatedUser() user: KeycloakTokenParsed,
    @Body() createVaultDto: CreateVaultDto,
  ) {
    await this.campaignService.checkCampaignOwner(user.sub, createVaultDto.campaignId)
    return this.vaultService.create(createVaultDto)
  }

  @Get()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll(@AuthenticatedUser() user: KeycloakTokenParsed) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.vaultService.findAll()
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findOne(@AuthenticatedUser() user: KeycloakTokenParsed, @Param('id') id: string) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.vaultService.findOne(id)
  }

  @Patch(':id')
  async update(
    @AuthenticatedUser() user: KeycloakTokenParsed,
    @Param('id') id: string,
    @Body() updateVaultDto: UpdateVaultDto,
  ) {
    await this.vaultService.checkVaultOwner(user.sub, id)

    return this.vaultService.update(id, updateVaultDto)
  }

  @Delete(':id')
  async remove(@AuthenticatedUser() user: KeycloakTokenParsed, @Param('id') id: string) {
    await this.vaultService.checkVaultOwner(user.sub, id)

    return this.vaultService.remove(id)
  }
}
