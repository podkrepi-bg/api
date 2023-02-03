import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { JwtService } from '@nestjs/jwt'
import { PersonService } from '../person/person.service'
import { Person } from '@prisma/client'
import { Logger } from '@nestjs/common'

@WebSocketGateway({ namespace: '/api/v1', transport: 'websocket' })
export class SocketGateway implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect {
  constructor(private jwtService: JwtService, private personService: PersonService) {}
  @WebSocketServer() server
  connectedClients = new Map<string, Person>()

  afterInit() {
    Logger.log('Websocket server initiated and ready to receive connections')
  }

  async handleConnection(client) {
    try {
      const token = client?.handshake?.query?.token
      const user = this.jwtService.decode(token)
      if (!user) {
        Logger.log('Invalid token')
        client.disconnect()
        return
      }
      const person = await this.personService.findOneByKeycloakId(user?.sub)
      if (!person) {
        client.disconnect()
        Logger.error('No such user with that keycloak id')
        return
      }

      this.connectedClients.set(client.id, person)

      Logger.log(`${person.firstName} ${person.lastName} --> connected`)
      Logger.log(this.connectedClients.size, 'total connected clients')
    } catch (error) {
      Logger.error(error, 'ERROR in connection')
      client.disconnect()
    }
  }

  handleDisconnect(client) {
    client.disconnect()
    const user = this.connectedClients.get(client.id)
    this.connectedClients.delete(client.id)
    Logger.log(`${user?.firstName} ${user?.lastName} disconnected`)
  }
}
