import { Controller, Get, Post, Body, Param, Delete, Logger } from '@nestjs/common'
import { OrganizerService } from './organizer.service'
import { CreateOrganizerDto } from './dto/create-organizer.dto'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { KeycloakTokenParsed } from '../auth/keycloak'

@Controller('organizer')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post()
  async create(
    @Body() createOrganizerDto: CreateOrganizerDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    if (!user) {
      const msg = 'User is not authenticated'
      Logger.error(msg)
      throw new Error(msg)
    }
    return await this.organizerService.create(createOrganizerDto)
  }

  @Get('list')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async findAll() {
    return await this.organizerService.findAll()
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return await this.organizerService.findOne(id)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async remove(@Param('id') id: string) {
    return await this.organizerService.remove(id)
  }
}
