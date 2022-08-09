import { ForgotPass } from '../auth/dto/forgot-password.dto'
import { CreatePersonDto } from '../person/dto/create-person.dto'
import { CreateInquiryDto } from '../support/dto/create-inquiry.dto'
import { CreateRequestDto } from '../support/dto/create-request.dto'

export enum TemplateType {
  welcome = 'welcome',
  welcomeInternal = 'welcome-internal',
  inquiryReceived = 'inquiry-received',
  inquiryReceivedInternal = 'inquiry-received-internal',
  forgotPass = 'forgot-password',
}
export type TemplateTypeKeys = keyof typeof TemplateType
export type TemplateTypeValues = typeof TemplateType[TemplateTypeKeys]

export interface BuiltTemplate {
  html: string
  metadata: {
    subject: string
  }
}
export type EmailMetadata = {
  subject: string
}

export abstract class EmailTemplate<C> {
  constructor(public context: C) {}
  public name: TemplateType
  get data(): C | unknown {
    return this.context
  }
}

export class ForgotPassDto extends EmailTemplate<CreatePersonDto> {
  name = TemplateType.forgotPass
}

export class WelcomeEmailDto extends EmailTemplate<CreateRequestDto> {
  name = TemplateType.welcome
}

export class WelcomeInternalEmailDto extends EmailTemplate<CreateRequestDto> {
  name = TemplateType.welcomeInternal
  get data() {
    return {
      info: JSON.stringify(this.context.toEntity(), null, 2),
    }
  }
}

export class InquiryReceivedEmailDto extends EmailTemplate<CreateInquiryDto> {
  name = TemplateType.inquiryReceived
}

export class InquiryReceivedInternalEmailDto extends EmailTemplate<CreateInquiryDto> {
  name = TemplateType.inquiryReceivedInternal
}
