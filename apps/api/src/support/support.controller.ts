import { Body, Controller, Get, Post } from '@nestjs/common'
import { Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

import { SupportService } from './support.service'
import { CreateInquiryDto } from './dto/create-inquiry.dto'
import { CreateRequestDto } from './dto/create-request.dto'

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('create-request')
  @Public()
  async postSupporter(@Body() createDto: CreateRequestDto) {
    console.log(createDto)
    return await this.supportService.createSupporter(createDto)
  }

  @Get('support-requests')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async getSuporters() {
    return await this.supportService.listSupportRequests()
  }

  @Post('create-inquiry')
  @Public()
  async postInfoRequest(@Body() createDto: CreateInquiryDto) {
    console.log(createDto)
    return await this.supportService.createInfoRequest(createDto)
  }

  @Get('info-requests')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async getInfoRequests() {
    return await this.supportService.listInfoRequests()
  }
}
