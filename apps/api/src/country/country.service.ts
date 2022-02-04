import { Injectable, Logger, NotFoundException } from '@nestjs/common'
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

  async getCountryById(id: string) {
    try {
      const country = await this.prisma.country.findFirst({
        where: {
          id: id,
        },
        rejectOnNotFound: true,
      })
      return country
    } catch (err) {
      const msg = 'No Country record with ID: ' + id

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  update(id: number, updateCountryDto: UpdateCountryDto) {
    return `This action updates a #${id} country`
  }

  remove(id: number) {
    return `This action removes a #${id} country`
  }
}
