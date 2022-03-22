import { BootcampNeli } from '@prisma/client'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { CreateBootcampNeliDto } from './dto/create-bootcampNeli.dto'
import { UpdateBootcampNeliDto } from './dto/update-bootCampNeli.dto'

type DeleteManyResponse = {
  count: number
}

@Injectable()
export class BootcampNeliService {
  constructor(private prisma: PrismaService) {}

  async createBootcampNeli(createBootcampNeliDto: CreateBootcampNeliDto): Promise<BootcampNeli> {
    return this.prisma.bootcampNeli.create({ data: createBootcampNeliDto.toEntity()})
  }

  async getAllBootcampNeli(): Promise<BootcampNeli[]> {
    const all = await this.prisma.bootcampNeli.findMany()
    return all
  }

  async getBootcampNeli(id: string): Promise<BootcampNeli> {
    const bootCampNeli = await this.prisma.bootcampNeli.findFirst({ where: { id} })
    if (!bootCampNeli) {
      const message = 'No record with ID: ' + id;
      Logger.warn(message)
      throw new NotFoundException(message)
    }
    return bootCampNeli
  }

  async updateBootcampNeli(id: string, updateBootcampNeliDto: UpdateBootcampNeliDto) {
    try {
      return await this.prisma.bootcampNeli.update({
        where: { id },
        data: updateBootcampNeliDto,
      })
    } catch (err) {
      const message = 'Update failed!'
      Logger.warn(message)
      throw new NotFoundException(message)
    }
  }

  async removeBootcampNeli(id: string) {
    try {
      return await this.prisma.bootcampNeli.delete({ where: { id} })
    } catch (err) {
      const message = 'Delete failed. No Document found with given ID'
      Logger.warn(message)
      throw new NotFoundException(message)
    }
  }

  async removeManyBootcampNeli(idsToDelete: string[]): Promise<DeleteManyResponse> {
    try {
      return await this.prisma.bootcampNeli.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      })
    } catch (err) {
      const message = 'Delete failed. No Document found with given ID'
      Logger.warn(message)
      throw new NotFoundException(message)
    }
  }
}
