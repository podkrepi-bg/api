import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { SocketGateway } from './gateway'
import { WebSocketService } from './socket.service'
import { PersonService } from './../person/person.service'
import { PrismaService } from './../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'

@Module({
  providers: [
    SocketGateway,
    WebSocketService,
    JwtService,
    PersonService,
    PrismaService,
    ConfigService,
  ],
  exports: [WebSocketService],
})
export class WebSocketModule {}
