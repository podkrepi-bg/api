import { Controller, Get } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'

import { AppService } from './app.service'

@Resource('account')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @Scopes()
  getData() {
    return this.appService.getData()
  }
}
