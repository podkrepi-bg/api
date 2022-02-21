import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { CoordinatorService } from './coordinator.service'
import { CreateCoordinatorDto } from './dto/create-coordinator.dto'

@Controller('coordinator')
export class CoordinatorController {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  @Post()
  @Public()
  create(@Body() createCoordinatorDto: CreateCoordinatorDto) {
    return this.coordinatorService.create(createCoordinatorDto)
  }

  @Get('list')
  findAll() {
    return this.coordinatorService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coordinatorService.findOne(id)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coordinatorService.remove(id)
  }
}
