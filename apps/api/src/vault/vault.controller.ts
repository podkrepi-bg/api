import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { VaultService } from './vault.service'
import { CreateVaultDto } from './dto/create-vault.dto'
import { UpdateVaultDto } from './dto/update-vault.dto'
import { Public } from 'nest-keycloak-connect'

@Controller('vault')
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Public()
  @Post()
  create(@Body() createVaultDto: CreateVaultDto) {
    return this.vaultService.create(createVaultDto)
  }

  @Public()
  @Get()
  findAll() {
    return this.vaultService.findAll()
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vaultService.findOne(id)
  }

  @Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVaultDto: UpdateVaultDto) {
    return this.vaultService.update(id, updateVaultDto)
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vaultService.remove(id)
  }
}
