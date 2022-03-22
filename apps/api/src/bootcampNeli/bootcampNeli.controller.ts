import { Public } from 'nest-keycloak-connect'
import { Body, Controller, Delete, Get, Param,Post, Put } from '@nestjs/common'

import { BootcampNeliService } from './bootcampNeli.service'

import { CreateBootcampNeliDto } from './dto/create-bootcampNeli.dto'
import { UpdateBootcampNeliDto } from './dto/update-bootCampNeli.dto'

@Controller('bootcampNeli')
export class BootcampNeliController {
  constructor(private readonly bootcampNeliService: BootcampNeliService) {}

  @Get()
  @Public()
  findAll() {
    return this.bootcampNeliService.getAllBootcampNeli()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.bootcampNeliService.getBootcampNeli(id)
  }

  @Post('create')
  @Public()
  create(@Body() creatBootcampNeliDto: CreateBootcampNeliDto) {
    return this.bootcampNeliService.createBootcampNeli(creatBootcampNeliDto)
  }

  @Put(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateBootcampNeliDto: UpdateBootcampNeliDto) {
    return this.bootcampNeliService.updateBootcampNeli(id, updateBootcampNeliDto)
  }

  @Post('delete-many')
  @Public()
  removeMany(@Body() idsToDelete: string[]) {
    return this.bootcampNeliService.removeManyBootcampNeli(idsToDelete)
  }
  
  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.bootcampNeliService.removeBootcampNeli(id)
  }

}