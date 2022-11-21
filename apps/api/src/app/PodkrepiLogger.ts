import { ConsoleLogger, LogLevel } from '@nestjs/common'
import { createFile } from '../common/helpers/storage.helper'

export class PodkrepiLogger extends ConsoleLogger {
  constructor(logLevels?: LogLevel[]) {
    super('PodkrepiLogger', { logLevels })
  }
  /**
   * Write a 'log' level log.
   */
  log(message: string) {
    super.log(message)
  }

  /**
   * Write an 'error' level log.
   */
  error(message: string) {
    // write the message to a file, send it to the database or do anything
    createFile('/', 'api-error.log', message)
    super.error(message)
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: string) {
    super.warn(message)
  }

  /**
   * Write a 'debug' level log.
   */
  debug(message: string) {
    super.debug(message)
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(message: string) {
    super.verbose(message)
  }
}
