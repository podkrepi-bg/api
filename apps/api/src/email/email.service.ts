import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import sgMail from '@sendgrid/mail'

import { Email, EmailData } from './email.interface'
import { TemplateName } from './template.interface'
import { TemplateService } from './template.service'

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

  async send(email: Email): Promise<void> {
    if (!this.enabled) return

    try {
      await sgMail.send(email)
    } catch (err) {
      Logger.warn(`error sending email`, err)
    }
  }

  async sendFromTemplate(templateName: TemplateName, data: unknown, emailInfo: Partial<Email> & { to: EmailData[] }) {
    if (!emailInfo.to) {
      throw new Error('emailInfo.to is required');
    }
    const { html, email } = await this.template.getTemplate({
      name: templateName,
      data,
    })

    this.send({
      to: emailInfo.to,
      from: emailInfo.from ?? this.emailSender,
      subject: email.subject,
      html,
    })
  }
}
