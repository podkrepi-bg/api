import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateCompanyDto } from './dto/create-company.dto'
import { UpdateCompanyDto } from './dto/update-company.dto'

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const cityId = createCompanyDto.cityId
    if (cityId) {
      const city = await this.prisma.city.findFirst({
        where: {
          id: cityId,
        },
      })
      if (city === null) {
        Logger.warn('No city record with ID: ' + cityId)
        throw new NotFoundException('No city record with ID: ' + cityId)
      }
    }
    return this.prisma.company.create({ data: createCompanyDto.toEntity() })
  }

  async findAll() {
    return this.prisma.company.findMany()
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
      },
    })
    if (company == null) {
      Logger.warn('No company record with ID: ' + id)
      throw new NotFoundException('No company record with ID: ' + id)
    }
    return company
  }

  async findOneByEIK(companyNumber: string) {
    return await this.prisma.company.findUnique({ where: { companyNumber } })
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    try {
      const company = await this.prisma.company.update({
        where: {
          id,
        },
        data: updateCompanyDto,
      })
      return company
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        Logger.warn('No company record with ID: ' + id)
        throw new NotFoundException('No company record with ID: ' + id)
      }
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.company.delete({
        where: {
          id,
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        Logger.warn('No company record with ID: ' + id)
        throw new NotFoundException('No company record with ID: ' + id)
      }
    }
  }
}
