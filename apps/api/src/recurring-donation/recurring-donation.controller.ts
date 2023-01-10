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

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() updateRecurringDonationDto: UpdateRecurringDonationDto) {
    return this.recurringDonationService.update(id, updateRecurringDonationDto)
  }

  @Get('cancel/:id')
  async cancel(@Param('id') id: string, @AuthenticatedUser() user: KeycloakTokenParsed) {
    Logger.log(`Cancelling recurring donation with id ${id}`)
    const rd = await this.recurringDonationService.findOne(id)
    if (!rd) {
      throw new Error(`Recurring donation with id ${id} not found`)
    }

    const isAdmin = user.realm_access?.roles.includes(RealmViewSupporters.role)

    if (!isAdmin && !this.recurringDonationService.donationBelongsTo(rd.id, user.sub)) {
      throw new Error(
        `User ${user.sub} is not allowed to cancel recurring donation with id ${id} of person: ${rd.personId}`,
      )
    }

    Logger.log(`Cancelling recurring donation to stripe with id ${id}`)
    return this.recurringDonationService.cancelSubscription(rd.extSubscriptionId)
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
