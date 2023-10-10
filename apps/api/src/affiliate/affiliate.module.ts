import { Module } from '@nestjs/common'
import { AffiliateController } from './affiliate.controller'
import { AffiliateService } from './affiliate.service'
import { PersonModule } from '../person/person.module'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [AffiliateController],
  providers: [AffiliateService, PrismaService],
  imports: [PersonModule],
})
export class AffiliateModule {}
