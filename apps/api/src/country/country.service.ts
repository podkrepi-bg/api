import { Injectable } from '@nestjs/common'
import { CreateCountryDto } from './dto/create-country.dto'
import { UpdateCountryDto } from './dto/update-country.dto'

@Injectable()
export class CountryService {
  create(createCountryDto: CreateCountryDto) {
    return 'This action adds a new country'
  }

  findAll() {
    return `This action returns all country`
  }

  findOne(slug: string) {
    return `This action returns a #${slug} country`
  }

  update(slug: string, updateCountryDto: UpdateCountryDto) {
    return `This action updates a #${slug} country`
  }

  remove(slug: string) {
    return `This action removes a #${slug} country`
  }
}
