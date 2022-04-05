import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { SupportService } from '../support/support.service'
import { InfoRequestController } from './info-request.controller'
import { InfoRequestService } from './info-request.service'

describe('InfoRequestController', () => {
  let controller: InfoRequestController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InfoRequestController],
      providers: [
        InfoRequestService,
        MockPrismaService,
        SupportService,
        EmailService,
        TemplateService,
        ConfigService,
      ],
    }).compile()

    controller = module.get<InfoRequestController>(InfoRequestController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
