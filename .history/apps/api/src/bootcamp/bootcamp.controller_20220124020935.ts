import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { BootcampService } from './bootcamp.service'
import { CreateBootcampDto } from './dto/create-bootcamp.dto'
import { UpdateBootcampDto } from './dto/update-bootcamp.dto'
import { Public } from 'nest-keycloak-connect'

@Controller('bootcamp')
export class BootcampController {
  constructor(private readonly bootcampService: BootcampService) {}

  @Post('create-bootcamp')
  @Public()
  async create(@Body() createBootcampDto: CreateBootcampDto) {
    return await this.bootcampService.createBootcamp(createBootcampDto)
  }

  @Get('list-all')
  @Public()
  findAll() {
    return this.bootcampService.listBootcamp()
  }

  @Get('list-one/:id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.bootcampService.listOne(id)
  }

  // @Patch('update-one/:id')
  // update(@Param('id') id: string, @Body() updateBootcampDto: UpdateBootcampDto) {
  //   return this.bootcampService.updateBootcamp(+id, updateBootcampDto)
  // }

  @Delete('delete-one/:id')
  @Public()
  remove(@Param('id') id: string) {
    return this.bootcampService.removeBootcamp(+id)
  }
}
