import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Welcome to Podkrepi.bg Backend API! See Swagger docs at /docs' }
  }
}
