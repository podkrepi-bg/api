import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PersonService } from './../person/person.service'
import { PrismaService } from './../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'
import { NotificationGateway } from './gateways/gateway'
import { NotificationService } from './services/notification.service'

@Module({
  providers: [
    NotificationGateway,
    NotificationService,
    JwtService,
    PersonService,
    PrismaService,
    ConfigService,
  ],
  exports: [NotificationService],
})
export class WebSocketModule {}
