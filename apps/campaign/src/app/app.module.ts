import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { CityModule } from '../city/city.module';

@Module({
  imports: [CityModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
