import { Public } from 'nest-keycloak-connect'
import { Body, Controller, Get, Post } from '@nestjs/common'

import { BeneficiaryService } from './beneficiary.service'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'

@Controller('beneficiary')
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

  @Post('create-beneficiary')
  @Public()
  async create(@Body() createDto: CreateBeneficiaryDto) {
    console.log(createDto)
    return await this.beneficiaryService.createBeneficiary(createDto)
  }

  @Get('list')
  @Public()
  async list() {
    return await this.beneficiaryService.listBeneficiaries()
  }
}
