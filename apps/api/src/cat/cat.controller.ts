import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { CatService } from './cat.service'
import { CreateCatDto } from './dto/create-cat.dto'
import { UpdateCatDto } from './dto/update-cat.dto'

@Controller('cat')
export class CatController {
  constructor(private readonly catService: CatService) {}

  @Post()
  @Public()
  create(@Body() createCatDto: CreateCatDto) {
    return this.catService.create(createCatDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.catService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
    return this.catService.update(+id, updateCatDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catService.remove(+id)
  }
}
