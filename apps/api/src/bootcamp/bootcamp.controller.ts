import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BootcampService } from './bootcamp.service';
import { CreateBootcampDto } from './dto/create-bootcamp.dto';
import { UpdateBootcampDto } from './dto/update-bootcamp.dto';

@Controller('bootcamp')
export class BootcampController {
  constructor(private readonly bootcampService: BootcampService) {}

  @Post()
  create(@Body() createBootcampDto: CreateBootcampDto) {
    return this.bootcampService.create(createBootcampDto);
  }

  @Get()
  findAll() {
    return this.bootcampService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bootcampService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBootcampDto: UpdateBootcampDto) {
    return this.bootcampService.update(+id, updateBootcampDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bootcampService.remove(+id);
  }
}
