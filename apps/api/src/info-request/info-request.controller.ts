import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InfoRequestService } from './info-request.service';
import { UpdateInfoRequestDto } from './dto/update-info-request.dto';
import { AuthenticatedUser, Public } from 'nest-keycloak-connect';
import { KeycloakTokenParsed } from '../auth/keycloak'
import { CreateInfoRequestDto } from './dto/create-info-request.dto';

@Controller('info-request')
export class InfoRequestController {
  constructor(private readonly infoRequestService: InfoRequestService) {}

  @Post()
  @Public(false)
  create(@Body() createInfoRequestDto: CreateInfoRequestDto, @AuthenticatedUser()
  user: KeycloakTokenParsed) {
    return this.infoRequestService.create(createInfoRequestDto, user.sub as string);
  }

  @Get('list')
  findAll() {
    return this.infoRequestService.findAll();
  }

  @Get(':id')
  @Public(false)
  findOne(@Param('id') id: string) {
    return this.infoRequestService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInfoRequestDto: UpdateInfoRequestDto) {
    return this.infoRequestService.update(id, updateInfoRequestDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.infoRequestService.remove(id);
  }
}
