import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { SupportService } from '../support/support.service'
import { InfoRequestService } from './info-request.service'

describe('InfoRequestService', () => {
  let service: InfoRequestService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        InfoRequestService,
        SupportService,
        EmailService,
        TemplateService,
        ConfigService,
      ],
    }).compile()

    service = module.get<InfoRequestService>(InfoRequestService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
