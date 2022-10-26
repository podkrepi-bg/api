import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { CoordinatorService } from './coordinator.service'
import { CreateCoordinatorDto } from './dto/create-coordinator.dto'
import { ApiTags } from '@nestjs/swagger';

@ApiTags('coordinator')
@Controller('coordinator')
export class CoordinatorController {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  @Post()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  create(@Body() createCoordinatorDto: CreateCoordinatorDto) {
    return this.coordinatorService.create(createCoordinatorDto)
  }

  @Get('list')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll() {
    return this.coordinatorService.findAll()
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findOne(@Param('id') id: string) {
    return this.coordinatorService.findOne(id)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.coordinatorService.remove(id)
  }
}
