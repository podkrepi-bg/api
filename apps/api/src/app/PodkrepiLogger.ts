import { ConsoleLogger, LogLevel } from '@nestjs/common'
import { appendToFile } from '../common/helpers/storage.helper'

export class PodkrepiLogger extends ConsoleLogger {
  constructor(logLevels?: LogLevel[]) {
    super('PodkrepiLogger', { logLevels })
  }

  log(message: string) {
    super.log(message)
  }

  error(message: string) {
    appendToFile('api-logs', 'api-error.log', `\n[ERROR] - ${message}`)
    super.error(message)
  }

  warn(message: string) {
    appendToFile('api-logs', 'api-warn.log', `\n[WARN] - ${message}`)
    super.warn(message)
  }

  debug(message: string) {
    appendToFile('api-logs', 'api-debug.log', `\n[DEBUG] - ${message}`)
    super.debug(message)
  }

  verbose(message: string) {
    appendToFile('api-logs', 'api-verbose.log', `\n[VERBOSE] - ${message}`)
    super.verbose(message)
  }
}
