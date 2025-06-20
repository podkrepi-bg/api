import { AuthenticatedUser, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common'

import { RecurringDonationService } from './recurring-donation.service'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { UpdateRecurringDonationDto } from './dto/update-recurring-donation.dto'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { ApiTags } from '@nestjs/swagger'
import { KeycloakTokenParsed } from '../auth/keycloak'

@ApiTags('recurring-donation')
@Controller('recurring-donation')
export class RecurringDonationController {
  constructor(private readonly recurringDonationService: RecurringDonationService) {}

  @Get('list')
  @Roles({
    roles: [RealmViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll() {
    return this.recurringDonationService.findAllWithNames()
  }

  @Get('user-donations')
  findUserDonations(@AuthenticatedUser() user: KeycloakTokenParsed) {
    return this.recurringDonationService.findUserRecurringDonations(user.sub)
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findOne(@Param('id') id: string) {
    return this.recurringDonationService.findOne(id)
  }

  @Post()
  @Roles({
    roles: [RealmViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  create(@Body() createRecurringDonationDto: CreateRecurringDonationDto) {
    return this.recurringDonationService.create(createRecurringDonationDto)
  }

  //TODO: Deprecate this endpont after FE is configured to call stripe cancel webhook
  @Patch(':id/cancel')
  async cancelSubscription(
    @Param('id') id: string,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    return await this.recurringDonationService.cancel(id, user)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() updateRecurringDonationDto: UpdateRecurringDonationDto) {
    return this.recurringDonationService.update(id, updateRecurringDonationDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.recurringDonationService.remove(id)
  }
}
