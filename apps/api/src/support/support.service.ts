import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InfoRequest, Supporter, Irregularity } from '@prisma/client'

import {
  InquiryReceivedEmailDto,
  InquiryReceivedInternalEmailDto,
  WelcomeEmailDto,
  WelcomeInternalEmailDto,
} from '../email/template.interface'
import { EmailService } from '../email/email.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateInquiryDto } from './dto/create-inquiry.dto'
import { CreateRequestDto } from './dto/create-request.dto'
import { CreateIrregularityDto } from './dto/create-irregularity.dto'

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private config: ConfigService,
  ) {}

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
    return await this.prisma.supporter.findMany({
      include: { person: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createInfoRequest(
    inputDto: CreateInquiryDto,
  ): Promise<Pick<InfoRequest, 'id' | 'personId'>> {
    const request = await this.prisma.infoRequest.create({ data: inputDto.toEntity() })

    this.sendInquiryReceivedEmail(inputDto)
    this.sendInquiryReceivedInternalEmail(inputDto)

    return {
      id: request.id,
      personId: request.personId,
    }
  }

  async createIrregularity(
    inputDto: CreateIrregularityDto,
  ): Promise<Pick<Irregularity, 'id' | 'personId'>> {
    const irregularity = await this.prisma.irregularity.create({ data: inputDto.toEntity() })

    return {
      id: irregularity.id,
      personId: irregularity.personId,
    }
  }

  async listInfoRequests(): Promise<InfoRequest[]> {
    return await this.prisma.infoRequest.findMany({
      include: { person: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async sendWelcomeEmail(inputDto: CreateRequestDto) {
    const email = new WelcomeEmailDto(inputDto)
    this.emailService.sendFromTemplate(
      email,
      { to: [inputDto.person.email] },
      {
        //Allow users to receive the mail, regardles of unsubscribes
        bypassUnsubscribeManagement: { enable: true },
      },
    )
  }

  async sendWelcomeInternalEmail(inputDto: CreateRequestDto) {
    const email = new WelcomeInternalEmailDto(inputDto)
    this.emailService.sendFromTemplate(
      email,
      { to: [this.getInternalEmail()] },
      {
        //Allow users to receive the mail, regardles of unsubscribes
        bypassUnsubscribeManagement: { enable: true },
      },
    )
  }

  async sendInquiryReceivedEmail(inputDto: CreateInquiryDto) {
    const email = new InquiryReceivedEmailDto(inputDto)
    this.emailService.sendFromTemplate(
      email,
      { to: [inputDto.email] },
      {
        //Allow users to receive the mail, regardles of unsubscribes
        bypassUnsubscribeManagement: { enable: true },
      },
    )
  }

  async sendInquiryReceivedInternalEmail(inputDto: CreateInquiryDto) {
    const email = new InquiryReceivedInternalEmailDto(inputDto)
    this.emailService.sendFromTemplate(
      email,
      { to: [this.getInternalEmail()] },
      {
        //Allow users to receive the mail, regardles of unsubscribes
        bypassUnsubscribeManagement: { enable: true },
      },
    )
  }

  getInternalEmail(): string {
    const internal = this.config.get<string>('sendgrid.internalNotificationsEmail')
    if (!internal) throw new Error('Internal notification email is not defined')
    return internal
  }
}
