import { Injectable } from '@nestjs/common'
import { ContactRequest, SupportRequest } from '.prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateRequestDto } from './dto/create-request.dto'
import { CreateInquiryDto } from './dto/create-inquiry.dto'

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createSupportRequest(inputDto: CreateRequestDto): Promise<SupportRequest> {
    return this.prisma.supportRequest.create({ data: inputDto.toEntity() })
  }

  async createSupportInquiry(inputDto: CreateInquiryDto): Promise<ContactRequest> {
    return this.prisma.contactRequest.create({
      select: {
        id: true,
        person: false,
        personId: true,
        message: true, // TODO: Find how to hide `message` prop from response
        createdAt: true,
        deletedAt: true,
        updatedAt: true,
      },
      data: inputDto.toEntity(),
    })
  }
}
