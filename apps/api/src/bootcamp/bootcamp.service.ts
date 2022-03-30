import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBootcampDto } from './dto/create-bootcamp.dto'
import { UpdateBootcampDto } from './dto/update-bootcamp.dto'

@Injectable()
export class BootcampService {
  constructor(private prisma: PrismaService) {}

  async create(createBootcampDto: CreateBootcampDto) {
    return await this.prisma.bootcamp.create({ data: createBootcampDto })
  }

  async findAll() {
    return await this.prisma.bootcamp.findMany()
  }

  async findOne(id: string) {
    return await this.prisma.bootcamp.findFirst({ where: { id } })
  }

  async update(id: string, updateBootcampDto: UpdateBootcampDto) {
    return await this.prisma.bootcamp.update({ where: { id }, data: updateBootcampDto })
  }

  async remove(id: string) {
    return await this.prisma.bootcamp.delete({ where: { id } })
  }
}
