import { City } from '@prisma/client'
import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { CityCreateDto } from './dto/createBootcamp.dto'

@Injectable()
export class CityService {
  constructor(private prisma: PrismaService) {}

  async listCities(): Promise<City[]> {
    return this.prisma.city.findMany()
  }

  async createCity(city: CityCreateDto) {
    return await this.prisma.city.create({ data: city })
  }

  async viewCity(id: string) {
    return await this.prisma.city.findFirst({ where: { id } })
  }

  async editCity(id: string, data: City) {
    return await this.prisma.city.update({ where: { id }, data })
  }

  async removeCity(id: string) {
    const beneficiaries = await this.prisma.beneficiary.findMany({ where: { cityId: id } })
    for (let i = 0; i < beneficiaries.length; i++) {
      const campaigns = await this.prisma.campaign.findMany({
        where: { beneficiaryId: beneficiaries[i].id },
      })
      campaigns.map(async (x) => {
        await this.prisma.campaign.delete({ where: { id: x.id } })
      })
      await this.prisma.beneficiary.delete({ where: { id: beneficiaries[i].id } })
    }
    return await this.prisma.city.delete({ where: { id } })
  }

  async searchByName(keyword: string) {
    const data = await this.prisma.city.findMany()
    return data.filter((x) => x.name.toLowerCase().includes(keyword.toLowerCase()))
  }

  async searchByCountry(keyword: string) {
    const data = await this.prisma.city.findMany({})
    return data.filter((x) => x.countryId.toLowerCase().includes(keyword.toLowerCase()))
  }
}
