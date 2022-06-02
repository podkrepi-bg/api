import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common'
import { RealmViewContactRequests, ViewContactRequests } from '@podkrepi-bg/podkrepi-types'
import { Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { IrregularityService } from './irregularity.service'
import { CreateIrregularityDto } from './dto/create-irregularity.dto'
import { UpdateIrregularityDto } from './dto/update-irregularity.dto'

@Controller('irregularity')
export class IrregularityController {
  constructor(private readonly irregularityService: IrregularityService) {}

  @Post()
  @Public()
  async create(@Body() createIrregularityDto: CreateIrregularityDto) {
    return await this.irregularityService.create(createIrregularityDto)
  }

  //TODO: define custom admin role for campaign reports

  @Get('list')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async findAll() {
    return await this.irregularityService.listIrregularities()
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async findOne(@Param('id') id: string) {
    return await this.irregularityService.getIrregularityById(id)
  }

  @Put(':id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async update(@Param('id') id: string, @Body() updateIrregularityDto: UpdateIrregularityDto) {
    return await this.irregularityService.update(id, updateIrregularityDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async remove(@Param('id') id: string) {
    return await this.irregularityService.removeIrregularityById(id)
  }
}
