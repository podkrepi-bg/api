import { Module } from '@nestjs/common'
import { NotificationGateway } from './gateway'
import { NotificationService } from './notification.service'

@Module({
  providers: [
    NotificationGateway,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class WebSocketModule {}
