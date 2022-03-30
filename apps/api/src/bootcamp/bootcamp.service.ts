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

  findOne(id: string) {
    return `This action returns a #${id} bootcamp`
  }

  update(id: string, updateBootcampDto: UpdateBootcampDto) {
    return `This action updates a #${id} bootcamp`
  }

  remove(id: string) {
    return `This action removes a #${id} bootcamp`
  }
}
