import { Injectable } from '@nestjs/common'
import { InfoRequest, Supporter } from '.prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateRequestDto } from './dto/create-request.dto'
import { CreateInquiryDto } from './dto/create-inquiry.dto'

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createSupportRequest(
    inputDto: CreateRequestDto,
  ): Promise<Pick<Supporter, 'id' | 'personId'>> {
    const request = await this.prisma.supporter.create({ data: inputDto.toEntity() })
    return {
      id: request.id,
      personId: request.personId,
    }
  }

  async createSupportInquiry(
    inputDto: CreateInquiryDto,
  ): Promise<Pick<InfoRequest, 'id' | 'personId'>> {
    const request = await this.prisma.infoRequest.create({ data: inputDto.toEntity() })
    return {
      id: request.id,
      personId: request.personId,
    }
  }
}
