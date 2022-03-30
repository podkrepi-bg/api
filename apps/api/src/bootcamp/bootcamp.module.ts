import { Module } from '@nestjs/common'
import { BootcampService } from './bootcamp.service'
import { BootcampController } from './bootcamp.controller'

@Module({
  controllers: [BootcampController],
  providers: [BootcampService],
})
export class BootcampModule {}
