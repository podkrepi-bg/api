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

import { VaultService } from './vault.service'
import { CampaignService } from '../campaign/campaign.service'
import { CreateVaultDto } from './dto/create-vault.dto'
import { UpdateVaultDto } from './dto/update-vault.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'

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
    this.campaignService.checkCampaignOwner(user.sub as string, createVaultDto.campaignId)
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
    this.vaultService.checkVaultOwner(user.sub as string, id)

    return this.vaultService.update(id, updateVaultDto)
  }

  @Delete(':id')
  async remove(@AuthenticatedUser() user: KeycloakTokenParsed, @Param('id') id: string) {
    this.vaultService.checkVaultOwner(user.sub as string, id)

    return this.vaultService.remove(id)
  }
}
