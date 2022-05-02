import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { BankAccountService } from './bankaccount.service'
import { CreateBankaccountDto } from './dto/create-bankaccount.dto'
import { UpdateBankaccountDto } from './dto/update-bankaccount.dto'

@Controller('bankaccount')
export class BankAccountController {
  constructor(private readonly bankaccountService: BankAccountService) {}

  @Post()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  create(@Body() createBankaccountDto: CreateBankaccountDto) {
    return this.bankaccountService.create(createBankaccountDto)
  }

  @Get()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll() {
    return this.bankaccountService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bankaccountService.findOne(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(@Param('id') id: string, @Body() updateBankaccountDto: UpdateBankaccountDto) {
    return this.bankaccountService.update(id, updateBankaccountDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.bankaccountService.remove(id)
  }
}
