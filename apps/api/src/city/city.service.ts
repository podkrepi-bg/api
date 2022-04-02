import { City } from '@prisma/client'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCityDto } from './dto/create-city.dto'
import { UpdateCityDto } from './dto/update-city.dto'

@Injectable()
export class CityService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<City[]> {
    return this.prisma.city.findMany({ include: { countryCode: true } })
  }

  async findOne(cityId: string): Promise<City> {
    const city = await this.prisma.city.findFirst({ where: { id: cityId } })
    if (!city) {
      Logger.warn('No city record with ID: ' + cityId)
      throw new NotFoundException('No city record with ID: ' + cityId)
    }
    return city
  }

  async create(createCityDto: CreateCityDto): Promise<City> {
    return this.prisma.city.create({ data: createCityDto })
  }

  async update(id: string, updateCityDto: UpdateCityDto) {
    try {
      return await this.prisma.city.update({
        where: { id },
        data: updateCityDto,
      })
    } catch (err) {
      const message = 'Update failed!'
      Logger.warn(err)
      throw new NotFoundException(message)
    }
  }

  async remove(cityId: string) {
    return await this.prisma.city.delete({ where: { id: cityId } })
  }
}
