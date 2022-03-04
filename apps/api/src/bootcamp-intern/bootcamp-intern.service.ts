import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateBootcampInternDto } from './dto/create-bootcamp-intern.dto'
import { UpdateBootcampInternDto } from './dto/update-bootcamp-intern.dto'
import { PrismaService } from '../prisma/prisma.service'
import { BootcampIntern } from '@prisma/client'
import { BootcampInternModule } from './bootcamp-intern.module'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'

@Injectable()
export class BootcampInternService {
  constructor(private prisma: PrismaService) {}

  create(createBootcampInternDto: CreateBootcampInternDto) {
    return this.prisma.bootcampIntern.create({ data: createBootcampInternDto })
  }

  async findAll(): Promise<BootcampIntern[]> {
    return this.prisma.bootcampIntern.findMany()
  }

  async findOne(id: string): Promise<BootcampInternModule | null> {
    return this.prisma.bootcampIntern.findFirst({
      where: {
        id,
      },
    })
  }

  async update(id: string, updateBootcampInternDto: UpdateBootcampInternDto) {
    try {
      const result = await this.prisma.bootcampIntern.update({
        where: { id },
        data: updateBootcampInternDto,
      })
      return result
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        Logger.warn('No record with id', +id)
        throw new NotFoundException('No record with id' + id)
      }
    }
  }

  remove(id: string) {
    return this.prisma.bootcampIntern.delete({ where: { id } })
  }
}
