import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BootcampSimeonService } from './bootcamp-simeon.service';
import { CreateBootcampSimeonDto } from './dto/create-bootcamp-simeon.dto';
import { UpdateBootcampSimeonDto } from './dto/update-bootcamp-simeon.dto';

@Controller('bootcamp-simeon')
export class BootcampSimeonController {
  constructor(private readonly bootcampSimeonService: BootcampSimeonService) {}

  @Post('create')
  create(@Body() createBootcampSimeonDto: CreateBootcampSimeonDto) {
    return this.bootcampSimeonService.create(createBootcampSimeonDto);
  }

  @Get()
  findAll() {
    return this.bootcampSimeonService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bootcampSimeonService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBootcampSimeonDto: UpdateBootcampSimeonDto) {
    return this.bootcampSimeonService.update(+id, updateBootcampSimeonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bootcampSimeonService.remove(+id);
  }
}
