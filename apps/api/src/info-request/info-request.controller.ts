import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { InfoRequestService } from './info-request.service'
import { UpdateInfoRequestDto } from './dto/update-info-request.dto'
import { Public } from 'nest-keycloak-connect'
import { CreateInquiryDto } from '../support/dto/create-inquiry.dto'

@Controller('info-request')
export class InfoRequestController {
  constructor(private readonly infoRequestService: InfoRequestService) {}

  @Post()
  @Public()
  create(@Body() createInfoRequestDto: CreateInquiryDto) {
    return this.infoRequestService.create(createInfoRequestDto)
  }

  @Get('list')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll() {
    return this.infoRequestService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.infoRequestService.findOne(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() updateInfoRequestDto: UpdateInfoRequestDto) {
    return this.infoRequestService.update(id, updateInfoRequestDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.infoRequestService.remove(id)
  }
}
