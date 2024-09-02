import sgMail from '@sendgrid/mail'
import * as sg from '@sendgrid/mail'
import { ConfigService } from '@nestjs/config'
import { Injectable, Logger } from '@nestjs/common'

import { Email, EmailData } from './email.interface'
import { TemplateService } from './template.service'
import { EmailTemplate } from './template.interface'

@Injectable()
export class EmailService {
  private enabled = true
  private emailSender: string

  constructor(private config: ConfigService, private template: TemplateService) {
    const apiKey = config.get<string>('sendgrid.apiKey')
    this.emailSender = this.config.get<string>('sendgrid.sender') ?? 'info@podkrepi.bg'
    if (apiKey) {
      sgMail.setApiKey(apiKey)
    } else {
      Logger.warn('no apiKey for sendgrid, will not send emails')
      this.enabled = false
    }
  }

  async send(email: Email, settings: sg.MailDataRequired['mailSettings'] = {}): Promise<void> {
    if (!this.enabled) return

    try {
      await sgMail.send({ ...email, mailSettings: { ...settings } })
    } catch (err) {
      Logger.warn(`error sending email`, err)
    }
  }

  async sendFromTemplate<C>(
    template: EmailTemplate<C>,
    emailInfo: Partial<Email> & { to: EmailData[] },
    settings: sg.MailDataRequired['mailSettings'] = {},
  ) {
    if (!emailInfo.to) {
      throw new Error('emailInfo.to is required')
    }

    const { html, metadata } = await this.template.getTemplate(template)
    this.send(
      {
        to: emailInfo.to,
        from: emailInfo.from ?? this.emailSender,
        subject: metadata.subject,
        html,
      },
      settings,
    )
  }
}
