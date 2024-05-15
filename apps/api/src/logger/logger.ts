import { ConsoleLogger, Injectable } from '@nestjs/common'
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry'

@Injectable()
export class MyLogger extends ConsoleLogger {
  constructor(@InjectSentry() private readonly client: SentryService) {
    super()
  }

  error(message: any, stack?: string, context?: string) {
    // add your tailored logic here

    this.client.instance().captureMessage(message, 'error')
    super.error(message, stack, context)
  }
}
