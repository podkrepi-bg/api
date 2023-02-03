import { Injectable } from '@nestjs/common'
import { SocketGateway } from './gateway'

@Injectable()
export class WebSocketService {
  constructor(private readonly socketGateway: SocketGateway) {}

  sendNotification(eventName: string, notificationData: any) {
    this.socketGateway.server.emit(eventName, notificationData)
  }

  sendMessage(eventName: string, clientId: string, message: string) {
    this.socketGateway.server.to(clientId).emit(eventName, message)
  }
}
