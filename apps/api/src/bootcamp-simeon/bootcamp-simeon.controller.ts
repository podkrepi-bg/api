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
import { BootcampSimeonService } from './bootcamp-simeon.service'
import { CreateBootcampSimeonDto } from './dto/create-bootcamp-simeon.dto'
import { UpdateBootcampSimeonDto } from './dto/update-bootcamp-simeon.dto'
import { Public } from 'nest-keycloak-connect'

@Controller('bootcamp-simeon')
export class BootcampSimeonController {
  constructor(private readonly bootcampSimeonService: BootcampSimeonService) {}

  @Post('create')
  @Public()
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
  async findOne(@Param('id') id: string) {
    try {
      const obj = await this.bootcampSimeonService.findOne(id)
      if(!obj) {
        throw new NotFoundException('Not found')
      }
      return obj
    } catch (error) {
      throw new NotFoundException('Not found')
    }
  }

  @Public()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateBootcampSimeonDto: UpdateBootcampSimeonDto) {
    try {
      const objToUpdate = await this.bootcampSimeonService.update(id, updateBootcampSimeonDto)
      if (!objToUpdate) {
        throw new NotFoundException('Not found')
      }
      return objToUpdate
    } catch (error) {
      throw new NotFoundException('Not found')
    }
  }

  @Public()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const response = await this.bootcampSimeonService.remove(id)
      if (!response) {
        throw new NotFoundException('Unsuccessful deletion - record not found')
      }
      return 'Successful deletion'
    } catch (error) {
      throw new NotFoundException('Unsuccessful deletion - record not found')
    }
  }
}
