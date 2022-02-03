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
    return await this.prisma.country.findMany()
  }

  async getCountryById(slug: string) {
    try {
      const country = await this.prisma.country.findFirst({
        where: {
          id: slug,
        },
        rejectOnNotFound: true,
      })
      return country
    } catch (err) {
      const msg = 'No Country record with ID: ' + slug

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  update(slug: string, updateCountryDto: UpdateCountryDto) {
    return `This action updates a #${slug} country`
  }

  remove(slug: string) {
    return `This action removes a #${slug} country`
  }
}
