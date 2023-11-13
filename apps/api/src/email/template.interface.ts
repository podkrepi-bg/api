import { Prisma } from '@prisma/client'
import { CreatePersonDto } from '../person/dto/create-person.dto'
import { CreateInquiryDto } from '../support/dto/create-inquiry.dto'
import { CreateRequestDto } from '../support/dto/create-request.dto'

export enum TemplateType {
  welcome = 'welcome',
  welcomeInternal = 'welcome-internal',
  inquiryReceived = 'inquiry-received',
  inquiryReceivedInternal = 'inquiry-received-internal',
  forgotPass = 'forgot-password',
  unrecognizedDonation = 'unrecognized-donation',
  expiringIrisConsent = 'expiring-iris-consent',
  confirmConsent = 'confirm-notifications-consent',
  campaignNewsDraft = 'campaign-news-draft',
  refundDonation = 'refund-donation',
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

export class ForgottenPasswordMailDto extends EmailTemplate<CreatePersonDto> {
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

export class UnrecognizedDonationEmailDto extends EmailTemplate<{
  transactions: Partial<Prisma.BankTransactionCreateManyInput>[]
  importDate: string
  link: string
}> {
  name = TemplateType.unrecognizedDonation
}

export class ExpiringIrisConsentEmailDto extends EmailTemplate<{
  daysToExpire: number
  expiresAt: string
  renewLink: string
}> {
  name = TemplateType.expiringIrisConsent
}

export class ConfirmConsentEmailDto extends EmailTemplate<{
  subscribeLink: string
}> {
  name = TemplateType.confirmConsent
}

export class CampaignNewsDraftEmailDto extends EmailTemplate<{
  campaignLink: string
  campaignName: string
  newsLink: string
  campaignNewsTitle: string
}> {
  name = TemplateType.campaignNewsDraft
}

export class RefundDonationEmailDto extends EmailTemplate<{
  campaignName: string
  netAmount: number
  taxAmount: number
  currency: string
}> {
  name = TemplateType.refundDonation
}
