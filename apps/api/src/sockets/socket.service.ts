import { Injectable } from '@nestjs/common'
import { SocketGateway } from './gateway'

@Injectable()
export class WebSocketService {
  constructor(private readonly socketGateway: SocketGateway) {}

  sendNotification(eventName: string, notification: string) {
    this.socketGateway.server.emit(eventName, notification)
  }

  sendMessage(eventName: string, clientId: string, message: string) {
    this.socketGateway.server.to(clientId).emit(eventName, message)
  }
}
