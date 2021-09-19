import { Injectable } from '@nestjs/common'
import { ContactRequest, SupportRequest } from '.prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateRequestDto } from './dto/create-request.dto'
import { CreateInquiryDto } from './dto/create-inquiry.dto'

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createSupportRequest(
    inputDto: CreateRequestDto,
  ): Promise<Pick<SupportRequest, 'id' | 'personId'>> {
    const request = await this.prisma.supportRequest.create({ data: inputDto.toEntity() })
    return {
      id: request.id,
      personId: request.personId,
    }
  }

  async createSupportInquiry(
    inputDto: CreateInquiryDto,
  ): Promise<Pick<ContactRequest, 'id' | 'personId'>> {
    const request = await this.prisma.contactRequest.create({ data: inputDto.toEntity() })
    return {
      id: request.id,
      personId: request.personId,
    }
  }
}
