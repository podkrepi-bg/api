import { Body, Controller, Get, Post } from '@nestjs/common'
import { Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

import { BeneficiaryService } from './beneficiary.service'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'

@Controller('beneficiary')
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

  @Post('create-beneficiary')
  @Public()
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
}
