import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { BootcampSimeonService } from './bootcamp-simeon.service'
import { CreateBootcampSimeonDto } from './dto/create-bootcamp-simeon.dto'
import { UpdateBootcampSimeonDto } from './dto/update-bootcamp-simeon.dto'

@Controller('bootcamp-simeon')
export class BootcampSimeonController {
  constructor(private readonly bootcampSimeonService: BootcampSimeonService) {}

  @Public()
  @Post('create')
  create(@Body() createBootcampSimeonDto: CreateBootcampSimeonDto) {
    return this.bootcampSimeonService.create(createBootcampSimeonDto)
  }

  @Public()
  @Get('all')
  findAll() {
    return this.bootcampSimeonService.findAll()
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bootcampSimeonService.findOne(+id)
  }

  @Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBootcampSimeonDto: UpdateBootcampSimeonDto) {
    return this.bootcampSimeonService.update(+id, updateBootcampSimeonDto)
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bootcampSimeonService.remove(+id)
  }
}
