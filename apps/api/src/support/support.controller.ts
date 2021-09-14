import { Body, Controller, Post } from '@nestjs/common'
import { CreateInquiryDto } from './dto/create-inquiry.dto'

import { CreateRequestDto } from './dto/create-request.dto'
import { SupportService } from './support.service'

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('create-request')
  async createRequest(@Body() createDto: CreateRequestDto) {
    return await this.supportService.createSupportRequest(createDto)
  }

  @Post('create-inquiry')
  async createInquiry(@Body() createDto: CreateInquiryDto) {
    return await this.supportService.createSupportInquiry(createDto)
  }
}
