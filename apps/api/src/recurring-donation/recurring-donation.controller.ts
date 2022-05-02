import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'

import { RecurringDonationService } from './recurring-donation.service'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { UpdateRecurringDonationDto } from './dto/update-recurring-donation.dto'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

@Controller('recurring-donation')
export class RecurringDonationController {
  constructor(private readonly recurringDonationService: RecurringDonationService) {}

  @Post()
  create(@Body() createRecurringDonationDto: CreateRecurringDonationDto) {
    return this.recurringDonationService.create(createRecurringDonationDto)
  }

  @Get()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll() {
    return this.recurringDonationService.findAll()
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

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.recurringDonationService.remove(id)
  }
}
