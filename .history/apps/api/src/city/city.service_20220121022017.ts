import { City } from '@prisma/client'
import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { CreateCityDto } from '../domain/generated/city/dto'

@Injectable()
export class CityService {
  constructor(private prisma: PrismaService) {}

  async listCities(): Promise<City[]> {
    return this.prisma.city.findMany()
  }

  async createCity(inputDto: CreateCityDto): Promise<City> {
    return this.prisma.city.create({ data: inputDto.toEntity() })
  }
}
