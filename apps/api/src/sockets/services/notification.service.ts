import { Injectable } from '@nestjs/common'
import { NotificationGateway } from '../gateways/gateway'

@Injectable()
export class NotificationService {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  sendNotification(eventName: string, notificationData: any) {
    this.notificationGateway.server.emit(eventName, notificationData)
  }

}
