import { Public } from 'nest-keycloak-connect'
import { Body, Controller, Post } from '@nestjs/common'

import { CreateInquiryDto } from './dto/create-inquiry.dto'
import { CreateRequestDto } from './dto/create-request.dto'
import { SupportService } from './support.service'

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('create-request')
  @Public()
  async createRequest(@Body() createDto: CreateRequestDto) {
    console.log(createDto)
    return await this.supportService.createSupportRequest(createDto)
  }

  @Post('create-inquiry')
  @Public()
  async createInquiry(@Body() createDto: CreateInquiryDto) {
    console.log(createDto)
    return await this.supportService.createSupportInquiry(createDto)
  }
}
