import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { BootcampService } from './bootcamp.service'
import { CreateBootcampDto } from './dto/create-bootcamp.dto'
import { UpdateBootcampDto } from './dto/update-bootcamp.dto'
import { Public } from 'nest-keycloak-connect'

@Controller('bootcamp')
export class BootcampController {
  constructor(private readonly bootcampService: BootcampService) {}

  @Post()
  @Public()
  create(@Body() createBootcampDto: CreateBootcampDto) {
    return this.bootcampService.createBootcamp(createBootcampDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.bootcampService.listBootcamp()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.bootcampService.listOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBootcampDto: UpdateBootcampDto) {
    return this.bootcampService.update(+id, updateBootcampDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bootcampService.remove(+id)
  }
}
