import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

import { BeneficiaryService } from './beneficiary.service'

type CreateBeneficiaryDto = {
  type: string
  personId?: string
  companyId?: string
  coordinatorId: string
  countryCode: string
  cityId: string
  description?: string
  publicData?: string
  privateData?: string
  campaigns: Record<string, never>
}

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
  async viewOne(@Param('id') id: string) {
    return await this.beneficiaryService.viewOne(id)
  }

  @Put(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async editOne(@Param('id') id: string, @Body() updateDto: CreateBeneficiaryDto) {
    return await this.beneficiaryService.updateOne(id, updateDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async deleteOne(@Param('id') id: string) {
    return await this.beneficiaryService.removeOne(id)
  }
}
