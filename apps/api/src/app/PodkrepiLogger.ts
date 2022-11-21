import { ConsoleLogger, LogLevel } from '@nestjs/common'
import { createFile } from '../common/helpers/storage.helper'

export class PodkrepiLogger extends ConsoleLogger {
  constructor(logLevels?: LogLevel[]) {
    super('PodkrepiLogger', { logLevels })
  }

  log(message: string) {
    super.log(message)
  }

  error(message: string) {
    createFile('/', 'api-error.log', message)
    super.error(message)
  }

  warn(message: string) {
    super.warn(message)
  }

  debug(message: string) {
    super.debug(message)
  }

  verbose(message: string) {
    super.verbose(message)
  }
}
