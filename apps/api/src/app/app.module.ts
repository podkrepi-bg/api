import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CityModule } from '../../../api/src/city/city.module';

@Module({
  imports: [CityModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
