import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { BenefactorService } from './benefactor.service'
import { CreateBenefactorDto } from './dto/create-benefactor.dto'
import { UpdateBenefactorDto } from './dto/update-benefactor.dto'
import { PrismaService } from '../prisma/prisma.service'
import { Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

@Controller('benefactor')
export class BenefactorController {
  constructor(private readonly benefactorService: BenefactorService) {}

  @Post()
  @Roles({
    roles: [RealmViewSupporters.role,],
    mode: RoleMatchingMode.ANY,
  })
  create(@Body() createBenefactorDto: CreateBenefactorDto) {
    return this.benefactorService.create(createBenefactorDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.benefactorService.findAll()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.benefactorService.findOne(id)
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateBenefactorDto: UpdateBenefactorDto) {
    return this.benefactorService.update(id, updateBenefactorDto)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.benefactorService.remove(id)
  }
}
