import { Body, Controller, Get, Post } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'
import { BeneficiaryService } from './beneficiary.service'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'

@Controller('beneficiary')
@Resource('beneficiary')
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

  @Post('create-beneficiary')
  @Public()
  @Scopes()
  async create(@Body() createDto: CreateBeneficiaryDto) {
    console.log(createDto)
    return await this.beneficiaryService.createBeneficiary(createDto)
  }

  @Get('list')
  @Public()
  @Scopes()
  async list() {
    return await this.beneficiaryService.listBeneficiaries()
  }
}
