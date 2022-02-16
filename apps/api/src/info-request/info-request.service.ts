import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateInquiryDto } from '../support/dto/create-inquiry.dto'
import { SupportService } from '../support/support.service'
import { UpdateInfoRequestDto } from './dto/update-info-request.dto'

@Injectable()
export class InfoRequestService {
  constructor(private prisma: PrismaService, private supportService: SupportService) {}

  create(createInfoRequestDto: CreateInquiryDto) {
    return this.supportService.createInfoRequest(createInfoRequestDto)
  }

  findAll() {
    return this.prisma.infoRequest.findMany({ include: { person: true } })
  }

  findOne(id: string) {
    return this.prisma.infoRequest.findUnique({ where: { id }, include: { person: true } })
  }

  update(id: string, updateInfoRequestDto: UpdateInfoRequestDto) {
    return this.prisma.infoRequest.update({ where: { id }, data: { ...updateInfoRequestDto } })
  }

  remove(id: string) {
    return this.prisma.infoRequest.delete({ where: { id } })
  }
}
