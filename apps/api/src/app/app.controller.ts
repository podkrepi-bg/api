import { Public } from 'nest-keycloak-connect'
import { Controller, Get } from '@nestjs/common'

import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getData() {
    return this.appService.getData()
  }
}
