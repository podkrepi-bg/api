import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { HedgehogService } from './hedgehog.service'
import { CreateHedgehogDto } from './dto/create-hedgehog.dto'
import { UpdateHedgehogDto } from './dto/update-hedgehog.dto'

import { Public } from 'nest-keycloak-connect'
import { ApiTags } from '@nestjs/swagger'

@Controller('hedgehog')
@ApiTags('hedgehog')
export class HedgehogController {
  constructor(private readonly hedgehogService: HedgehogService) {}

  @Post()
  @Public()
  create(@Body() createHedgehogDto: CreateHedgehogDto) {
    return this.hedgehogService.create(createHedgehogDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.hedgehogService.findAll()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.hedgehogService.findOne({id})
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateHedgehogDto: UpdateHedgehogDto) {
    return this.hedgehogService.update({id}, updateHedgehogDto)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.hedgehogService.remove({id})
  }
}
