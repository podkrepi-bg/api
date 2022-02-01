import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateBootcampDto } from './dto/create-bootcamp.dto'
import { UpdateBootcampDto } from './dto/update-bootcamp.dto'
import { PrismaService } from '../prisma/prisma.service'
import { Bootcamp } from '@prisma/client'

@Injectable()
export class BootcampService {
  constructor(private prisma: PrismaService) {}

  async createBootcamp(createBootcampDto: CreateBootcampDto) {
    return this.prisma.bootcamp.create({ data: createBootcampDto })
  }
  async listBootcamp(): Promise<Bootcamp[]> {
    return this.prisma.bootcamp.findMany()
  }

  async listOne(bootcampId: number): Promise<Bootcamp> {
    const bootcamp = await this.prisma.bootcamp.findFirst({ where: { id: bootcampId.toString() } })
    if (!bootcamp) {
      Logger.warn('No campaign record with ID: ' + bootcampId)
      throw new NotFoundException('No campaign record with ID: ' + bootcampId)
    }
    return bootcamp
  }

  update(id: number, updateBootcampDto: UpdateBootcampDto) {
    return `This action updates a #${id} bootcamp`
  }

  remove(id: number) {
    return `This action removes a #${id} bootcamp`
  }
}
