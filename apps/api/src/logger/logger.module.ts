import { Module } from '@nestjs/common'
import { MyLogger } from './logger'

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
