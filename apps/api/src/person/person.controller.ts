import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { PersonService } from './person.service'
import { CreatePersonDto } from './dto/create-person.dto'
import { UpdatePersonDto } from './dto/update-person.dto'
import { ApiTags } from '@nestjs/swagger'
import { PersonQueryDecorator } from '../common/dto/person-filter-decorator'
import { PersonQueryDto } from '../common/dto/person-query-dto'

@ApiTags('person')
@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async create(@Body() createPersonDto: CreatePersonDto) {
    return await this.personService.create(createPersonDto)
  }

  @Get()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  @PersonQueryDecorator()
  async findAll(@Query() query?: PersonQueryDto) {
    return await this.personService.findAll(
      query?.search,
      query?.sortBy,
      query?.sortOrder,
      query?.pageindex,
      query?.pagesize,
    )
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.personService.findOne(id)
  }

  @Get('by-keylock-id/:keylockId')
  async findOneByKeylockId(@Param('keylockId') id: string) {
    return await this.personService.findOneByKeycloakId(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
    return this.personService.update(id, updatePersonDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async remove(@Param('id') id: string) {
    return await this.personService.remove(id)
  }
}
