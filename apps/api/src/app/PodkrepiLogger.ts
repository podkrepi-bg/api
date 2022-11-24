import { ConsoleLogger, LogLevel } from '@nestjs/common'
import { appendToFile } from '../common/helpers/storage.helper'

export enum LogLevelEnum {
  LOG = 'log',
  ERROR = 'error',
  WARN = 'warn',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}
export class PodkrepiLogger extends ConsoleLogger {
  constructor(logLevels?: LogLevel[]) {
    super('PodkrepiLogger', { logLevels })
  }

  private formatLog(message: string, level: LogLevelEnum = LogLevelEnum.LOG) {
    return `\n[${level.toUpperCase()}] - ${new Date().toLocaleString()} - ${message}`
  }

  log(message: string) {
    super.log(message)
  }

  error(message: string) {
    appendToFile('api-logs', 'api-error.log', this.formatLog(message, LogLevelEnum.ERROR))
    super.error(message)
  }

  warn(message: string) {
    appendToFile('api-logs', 'api-warn.log', this.formatLog(message, LogLevelEnum.WARN))
    super.warn(message)
  }

  debug(message: string) {
    appendToFile('api-logs', 'api-debug.log', this.formatLog(message, LogLevelEnum.DEBUG))
    super.debug(message)
  }

  verbose(message: string) {
    appendToFile('api-logs', 'api-verbose.log', this.formatLog(message, LogLevelEnum.VERBOSE))
    super.verbose(message)
  }
}
