import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { TikvaService } from './tikva.service'
import { CreateTikvaDto } from './dto/create-tikva.dto'
import { UpdateTikvaDto } from './dto/update-tikva.dto'
import { Public } from 'nest-keycloak-connect'

@Controller('tikva')
export class TikvaController {
  constructor(private readonly tikvaService: TikvaService) {}

  @Post()
  @Public()
  create(@Body() createTikvaDto: CreateTikvaDto) {
    return this.tikvaService.create(createTikvaDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.tikvaService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tikvaService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTikvaDto: UpdateTikvaDto) {
    return this.tikvaService.update(+id, updateTikvaDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tikvaService.remove(+id)
  }
}
