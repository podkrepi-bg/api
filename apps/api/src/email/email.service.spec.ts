import sgMail from '@sendgrid/mail'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { EmailService } from './email.service'
import { TemplateService } from '../email/template.service'
import { EmailTemplate } from './template.interface'
import { CreateRequestDto } from '../support/dto/create-request.dto'

const sendMock = jest.spyOn(sgMail, 'send')
const setApiKeyMock = jest.spyOn(sgMail, 'setApiKey')
const html = '<div> Test </div>'
const subject = 'test subject'
const partialEmail = {
  to: ['test@test.com'],
  from: 'test@test.com',
}
const emailMock = {
  ...partialEmail,
  ...{ subject, html },
}
describe('EmailService enabled ', () => {
  let service: EmailService
  const emailTemplateMock = beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService, TemplateService, ConfigService],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get(key: string) {
          return key === 'sendgrid.apiKey' ? 'SG.test' : undefined
        },
      })
      .overrideProvider(TemplateService)
      .useValue({
        getTemplate() {
          return { html, metadata: { subject } }
        },
      })
      .compile()

    service = module.get<EmailService>(EmailService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
    expect(setApiKeyMock).toHaveBeenCalled()
  })

  it('send() should send email successfully', async () => {
    await service.send(emailMock)
    expect(sendMock).toHaveBeenCalledWith(emailMock)
  })

  it('sendFromTemplate() should send email successfully', async () => {
    await service.sendFromTemplate({} as EmailTemplate<CreateRequestDto>, partialEmail)
    expect(sendMock).toHaveBeenCalledWith(emailMock)
  })

  it('sendFromTemplate() should send email successfully with default sender', async () => {
    await service.sendFromTemplate({} as EmailTemplate<CreateRequestDto>, {
      ...partialEmail,
      ...{ from: undefined },
    })
    expect(sendMock).toHaveBeenCalledWith({ ...emailMock, ...{ from: 'info@podkrepi.bg' } })
  })

  it('sendFromTemplate() should throw error for missing recipient', async () => {
    await expect(
      service.sendFromTemplate({} as EmailTemplate<CreateRequestDto>, {
        ...partialEmail,
        ...{ to: undefined as never },
      }),
    ).rejects.toThrow(new Error('emailInfo.to is required'))
    expect(sendMock).not.toHaveBeenCalled()
  })
})

describe('EmailService disabled ', () => {
  let service: EmailService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService, TemplateService, ConfigService],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get() {},
      })
      .compile()

    service = module.get<EmailService>(EmailService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
    expect(setApiKeyMock).not.toHaveBeenCalled()
  })

  it('send() should not send email if service is not enabled', async () => {
    await service.send(emailMock)
    expect(sendMock).not.toHaveBeenCalled()
  })
})
