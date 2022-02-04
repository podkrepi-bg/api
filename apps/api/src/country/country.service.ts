import { Injectable } from '@nestjs/common'
import { Country } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCountryDto } from './dto/create-country.dto'
import { UpdateCountryDto } from './dto/update-country.dto'

@Injectable()
export class CountryService {
  constructor(private prisma: PrismaService) {}
  
  create(createCountryDto: CreateCountryDto) {
    return 'This action adds a new country'
  }

  async listCountries(): Promise<Country[]> {
    const countries = await this.prisma.country.findMany({})
    return countries
  }

  findOne(id: number) {
    return `This action returns a #${id} country`
  }

  update(id: number, updateCountryDto: UpdateCountryDto) {
    return `This action updates a #${id} country`
  }

  remove(id: number) {
    return `This action removes a #${id} country`
  }
}
