import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { BootcampService } from './bootcamp.service'
import { CreateBootcampDto } from './dto/create-bootcamp.dto'
import { UpdateBootcampDto } from './dto/update-bootcamp.dto'

@Controller('bootcamp')
export class BootcampController {
  constructor(private readonly bootcampService: BootcampService) {}

  @Post()
  @Public()
  async create(@Body() createBootcampDto: CreateBootcampDto) {
    return await this.bootcampService.create(createBootcampDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.bootcampService.findAll()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.bootcampService.findOne(id)
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateBootcampDto: UpdateBootcampDto) {
    return this.bootcampService.update(id, updateBootcampDto)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.bootcampService.remove(id)
  }
}
