import { Body, Controller, Get, Post } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'

import { EmailService } from './email.service'

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('send-attachment')
  @Public()
  async sendAttach() {
    return await this.emailService.sendAttachment()
  }
}
