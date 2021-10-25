import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import sgMail from '@sendgrid/mail'

import { Email } from './email.interface'

@Injectable()
export class EmailService {
  private enabled = true

  constructor(private config: ConfigService) {
    const apiKey = config.get<string>('sendgrid.apiKey')
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
}
