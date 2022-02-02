import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { BootcampInternService } from './bootcamp-intern.service'
import { CreateBootcampInternDto } from './dto/create-bootcamp-intern.dto'
import { UpdateBootcampInternDto } from './dto/update-bootcamp-intern.dto'

@Controller('bootcamp-intern')
export class BootcampInternController {
  constructor(private readonly bootcampInternService: BootcampInternService) {}

  @Post()
  @Public()
  create(@Body() createBootcampInternDto: CreateBootcampInternDto) {
    return this.bootcampInternService.create(createBootcampInternDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.bootcampInternService.findAll()
  }

  @Get(':id')
  @Public()
 async findOne(@Param('id') id: string) {
   const result = await this.bootcampInternService.findOne(id)
    if(result === null){
      throw new NotFoundException({ error: 'not found'});
     
    }
    return result;
  }

  @Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBootcampInternDto: UpdateBootcampInternDto) {
    return this.bootcampInternService.update(id, updateBootcampInternDto)
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bootcampInternService.remove(id)
  }
}
