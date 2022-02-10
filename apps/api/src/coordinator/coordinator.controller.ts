import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { CoordinatorService } from './coordinator.service'
import { CreateCoordinatorDto } from './dto/create-coordinator.dto'
import { UpdateCoordinatorDto } from './dto/update-coordinator.dto'

@Controller('coordinator')
export class CoordinatorController {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  @Post()
  @Public()
  create(@Body() createCoordinatorDto: CreateCoordinatorDto) {
    return this.coordinatorService.create(createCoordinatorDto)
  }

  @Get('list')
  @Public()
  findAll() {
    return this.coordinatorService.findAll()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.coordinatorService.findOne(id)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.coordinatorService.remove(id)
  }
}
