import sgMail from '@sendgrid/mail'
import { ConfigService } from '@nestjs/config'
import { Injectable, Logger } from '@nestjs/common'
import fs from 'fs'
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

  async send(email: Email): Promise<void> {
    if (!this.enabled) return

    try {
      await sgMail.send(email)
    } catch (err) {
      Logger.warn(`error sending email`, err)
    }
  }

  async sendFromTemplate<C>(
    template: EmailTemplate<C>,
    emailInfo: Partial<Email> & { to: EmailData[] },
  ) {
    if (!emailInfo.to) {
      throw new Error('emailInfo.to is required')
    }
    const { html, metadata } = await this.template.getTemplate(template)

    this.send({
      to: emailInfo.to,
      from: emailInfo.from ?? this.emailSender,
      subject: metadata.subject,
      html,
    })
  }

  async sendAttachment() {
    type message = {
      to: [string]
      from: string
      subject: string
      html: string
      attachments: {
        content: string
        filename: string
        type: string
        disposition: string
        content_id: string
      }[]
    }
    const msg: message = {
      to: ['borkata90@mail.bg'],
      from: 'info@podkrepi.bg',
      subject: 'Certificates',
      html: '<p>Here’s an attachment for you!</p>',
      attachments: [],
    }
    const path = require('path')
    const basePath = process.cwd()
    const dir = path.join(basePath)
    fs.readdirSync(`${dir}/pdf-data-demo`).forEach((file) => {
      const data = fs.readFileSync(`${dir}/pdf-data-demo/${file}`)
      if (data) {
        msg.attachments.push({
          content: data.toString('base64'),
          filename: 'podkrepi-bg.pdf',
          type: 'application/pdf',
          disposition: 'attachment',
          content_id: 'mytext',
        })
      }
    })
    this.send(msg)
    // const response = await axios.request({
    // method: 'GET',
    // url: 'http://localhost:3040/api/pdf/certificate/ef735a19-9d52-438c-859b-9f970df20e1b',
    // responseType: 'arraybuffer',
    // })

    // if (response.data) {
    // const textBuffered = Buffer.from(response.data)

    // const msg = {
    // to: ['borkata90@mail.bg'],
    // from: 'info@podkrepi.bg',
    // subject: 'Attachment',
    // html: '<p>Here’s an attachment for you!</p>',
    // attachments: [
    // {
    // content: textBuffered.toString('base64'),
    // filename: 'some-attachment.pdf',
    // type: 'application/pdf',
    // disposition: 'attachment',
    // content_id: 'mytext',
    // },
    // ],
    // }
    // this.send(msg)
    // }
  }
}
