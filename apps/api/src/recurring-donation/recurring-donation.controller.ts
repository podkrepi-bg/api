import { AuthenticatedUser, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common'

import { RecurringDonationService } from './recurring-donation.service'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { UpdateRecurringDonationDto } from './dto/update-recurring-donation.dto'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { ApiTags } from '@nestjs/swagger';
import { KeycloakTokenParsed } from '../auth/keycloak'

@ApiTags('recurring-donation')
@Controller('recurring-donation')
export class RecurringDonationController {
  constructor(
    private readonly recurringDonationService: RecurringDonationService
  ) {}

  @Post()
  create(@Body() createRecurringDonationDto: CreateRecurringDonationDto) {
    return this.recurringDonationService.create(createRecurringDonationDto)
  }

  @Get('list')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll() {
    return this.recurringDonationService.findAllWithNames()
  }

  @Get('user-donations')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
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

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() updateRecurringDonationDto: UpdateRecurringDonationDto) {
    return this.recurringDonationService.update(id, updateRecurringDonationDto)
  }

  @Get('cancel/:id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  cancel(@Param('id') id: string) {
    Logger.log(`Cancelling recurring donation with id ${id}`)
    const recurringDonation = this.recurringDonationService.findOne(id)
    recurringDonation.then((rd) => {
      if (rd) {
        Logger.log(`Cancelling recurring donation to stripe with id ${id}`)
        this.recurringDonationService.cancelSubscription(rd.extSubscriptionId)
      }
    }).then((response) => {
      Logger.debug("Cancel subscription response: ", response)
    })
    return this.recurringDonationService.cancel(id)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.recurringDonationService.remove(id)
  }
}
