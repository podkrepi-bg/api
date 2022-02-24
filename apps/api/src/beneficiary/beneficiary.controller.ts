import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

import { BeneficiaryService } from './beneficiary.service'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto'

@Controller('beneficiary')
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

  @Post('create-beneficiary')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async create(@Body() createDto: CreateBeneficiaryDto) {
    return await this.beneficiaryService.createBeneficiary(createDto)
  }

  @Get('list')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async list() {
    return await this.beneficiaryService.listBeneficiaries()
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async getById(@Param('id') id: string) {
    return await this.beneficiaryService.viewBeneficiary(id)
  }

  @Put(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async editById(@Param('id') id: string, @Body() data: UpdateBeneficiaryDto) {
    return await this.beneficiaryService.editBeneficiary(id, data)
  }
}
