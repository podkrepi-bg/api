import { forwardRef, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CampaignModule } from '../campaign/campaign.module'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultController } from './vault.controller'
import { VaultService } from './vault.service'
import { WebSocketModule } from './../sockets/socket.module'
@Module({
  imports: [forwardRef(() => CampaignModule), WebSocketModule],

  controllers: [VaultController],
  providers: [VaultService, CampaignService, PrismaService, PersonService, ConfigService],
  exports: [VaultService],
})
export class VaultModule {}
