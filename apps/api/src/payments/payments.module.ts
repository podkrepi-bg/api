import { Module } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
