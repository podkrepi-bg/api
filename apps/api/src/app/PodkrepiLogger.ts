import { ConsoleLogger, LogLevel } from '@nestjs/common'
import { appendToFile } from '../common/helpers/storage.helper'

export class PodkrepiLogger extends ConsoleLogger {
  constructor(logLevels?: LogLevel[]) {
    super('PodkrepiLogger', { logLevels })
  }

  log(message: string) {
    super.log(message)
  }

  error(message: string, ...args) {
    appendToFile('api-logs', 'api-error.log', message)
    super.error(message, args)
  }

  warn(message: string) {
    appendToFile('api-logs', 'api-warn.log', message)
    super.warn(message)
  }

  debug(message: string) {
    appendToFile('api-logs', 'api-debug.log', message)
    super.debug(message)
  }

  verbose(message: string) {
    appendToFile('api-logs', 'api-verbose.log', message)
    super.verbose(message)
  }
}
