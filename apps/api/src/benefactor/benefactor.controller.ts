import { RealmViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'

import { BenefactorService } from './benefactor.service'
import { CreateBenefactorDto } from './dto/create-benefactor.dto'
import { UpdateBenefactorDto } from './dto/update-benefactor.dto'
import { ApiTags } from '@nestjs/swagger';

@ApiTags('benefactor')
@Controller('benefactor')
export class BenefactorController {
  constructor(private readonly benefactorService: BenefactorService) {}

  @Post()
  @Roles({
    roles: [RealmViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  create(@Body() createBenefactorDto: CreateBenefactorDto) {
    return this.benefactorService.create(createBenefactorDto)
  }

  @Get()
  @Roles({
    roles: [RealmViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll() {
    return this.benefactorService.findAll()
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findOne(@Param('id') id: string) {
    return this.benefactorService.findOne(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() updateBenefactorDto: UpdateBenefactorDto) {
    return this.benefactorService.update(id, updateBenefactorDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.benefactorService.remove(id)
  }
}
