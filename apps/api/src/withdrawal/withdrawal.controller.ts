import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { WithdrawalService } from './withdrawal.service'
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto'
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto'

@Controller('withdrawal')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  create(@Body() createWithdrawalDto: CreateWithdrawalDto) {
    return this.withdrawalService.create(createWithdrawalDto)
  }

  @Get()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll() {
    return this.withdrawalService.findAll()
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findOne(@Param('id') id: string) {
    return this.withdrawalService.findOne(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() updateWithdrawalDto: UpdateWithdrawalDto) {
    return this.withdrawalService.update(id, updateWithdrawalDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.withdrawalService.remove(id)
  }
}
