import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  private appVersion: string;

  constructor() {
    this.appVersion = process.env.APP_VERSION || 'unknown'
  }

  getData(): { message: string } {
    return { message: 'Welcome to Podkrepi.bg Backend API ' + this.appVersion + '! See Swagger docs at /docs' }
  }
}
