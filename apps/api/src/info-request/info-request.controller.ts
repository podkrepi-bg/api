import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InfoRequestService } from './info-request.service';
import { CreateInfoRequestDto } from './dto/create-info-request.dto';
import { UpdateInfoRequestDto } from './dto/update-info-request.dto';

@Controller('info-request')
export class InfoRequestController {
  constructor(private readonly infoRequestService: InfoRequestService) {}

  @Post()
  create(@Body() createInfoRequestDto: CreateInfoRequestDto) {
    return this.infoRequestService.create(createInfoRequestDto);
  }

  @Get()
  findAll() {
    return this.infoRequestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.infoRequestService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInfoRequestDto: UpdateInfoRequestDto) {
    return this.infoRequestService.update(+id, updateInfoRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.infoRequestService.remove(+id);
  }
}
