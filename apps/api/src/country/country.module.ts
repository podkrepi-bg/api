import { Module } from '@nestjs/common'
import { CountryService } from './country.service'
import { CountryController } from './country.controller'

@Module({
  controllers: [CountryController],
  providers: [CountryService],
})
export class CountryModule {}
