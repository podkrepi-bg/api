import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  private appVersion: string;

  constructor() {
    this.appVersion = process.env.APP_VERSION || 'unknown'
  }

  getData(): { version: string, message: string } {
    return {
      version: this.appVersion,
      message: 'Welcome to Podkrepi.bg Backend API! See Swagger docs at /docs'
    }
  }
}
