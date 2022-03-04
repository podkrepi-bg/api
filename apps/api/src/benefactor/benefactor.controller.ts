import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { BenefactorService } from './benefactor.service'
import { CreateBenefactorDto } from './dto/create-benefactor.dto'
import { UpdateBenefactorDto } from './dto/update-benefactor.dto'
import { PrismaService } from '../prisma/prisma.service'

@Controller('benefactor')
export class BenefactorController {
  constructor(private readonly benefactorService: BenefactorService) {}

  @Public()
  @Post()
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
