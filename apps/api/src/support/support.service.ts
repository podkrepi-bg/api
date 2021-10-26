import { Injectable } from '@nestjs/common'
import { InfoRequest, Supporter } from '.prisma/client'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRequestDto } from './dto/create-request.dto'
import { CreateInquiryDto } from './dto/create-inquiry.dto'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
@Injectable()
export class SupportService {
  internalNotifications: string

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private template: TemplateService,
    private config: ConfigService,
  ) {
    this.internalNotifications = this.config.get<string>('sendgrid.internalNotificationsEmail') ?? 'info@podkrepi.bg'
  }

  async createSupporter(inputDto: CreateRequestDto): Promise<Pick<Supporter, 'id' | 'personId'>> {
    const request = await this.prisma.supporter.create({ data: inputDto.toEntity() })
    this.sendWelcomeEmail(inputDto)
    this.sendWelcomeInternalEmail(inputDto)

    return {
      id: request.id,
      personId: request.personId,
    }
  }

  async listSupportRequests(): Promise<Supporter[]> {
    return await this.prisma.supporter.findMany({ include: { person: true } })
  }

  async createInfoRequest(
    inputDto: CreateInquiryDto,
  ): Promise<Pick<InfoRequest, 'id' | 'personId'>> {
    const request = await this.prisma.infoRequest.create({ data: inputDto.toEntity() })
    this.sendInquiryReceivedEmail(inputDto)

    return {
      id: request.id,
      personId: request.personId,
    }
  }

  async listInfoRequests(): Promise<InfoRequest[]> {
    return await this.prisma.infoRequest.findMany({ include: { person: true } })
  }

  async sendWelcomeEmail(inputDto: CreateRequestDto) {
    this.email.sendFromTemplate('welcome', inputDto, { to: [inputDto.person.email] });
  }

  async sendWelcomeInternalEmail(inputDto: CreateRequestDto) {
    this.email.sendFromTemplate('welcome-internal', inputDto, { to: [this.internalNotifications] });
  }

  async sendInquiryReceivedEmail(inputDto: CreateInquiryDto) {
    this.email.sendFromTemplate('inquiry-received', inputDto, { to: [inputDto.email] });
  }

  async sendInquiryReceivedInternalEmail(inputDto: CreateInquiryDto) {
    this.email.sendFromTemplate('inquiry-received-internal', inputDto, { to: [this.internalNotifications] });
  }
}
