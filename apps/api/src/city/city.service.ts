import { City } from '@prisma/client'
import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CityService {
  constructor(private prisma: PrismaService) {}

  async listCities(): Promise<City[]> {
    return this.prisma.city.findMany()
  }
}
