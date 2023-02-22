import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server } from 'socket.io'

@WebSocketGateway({ namespace: '/api/v1', transport: 'websocket' })
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  constructor() {}
  @WebSocketServer() server: Server

  async afterInit() {
    Logger.log('Websocket server initiated and ready to receive connections')
  }

  async handleConnection(client) {
    Logger.warn(`New Client Connected: ${client.id}`)
  }

  handleDisconnect(client) {
    client.disconnect()
    Logger.warn(`${client.id} disconnected`)
  }
}
