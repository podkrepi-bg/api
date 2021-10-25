import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import sgMail from '@sendgrid/mail'

import { Email } from './email.interface'

@Injectable()
export class EmailService {

  constructor(private config: ConfigService) {
    const apiKey = config.get<string>('sendgrid.apiKey')
    if (apiKey) {
      sgMail.setApiKey(apiKey)
    } else {
      Logger.warn('no apiKey for sendgrid, will not send emails')
    }
  }

  async send(email: Email) {
    try {
      await sgMail.send(email);
    } catch (err) {
      Logger.warn(`error sending email`, err);
    }
  }
}
