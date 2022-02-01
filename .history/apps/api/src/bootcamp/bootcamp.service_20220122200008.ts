import { Injectable } from '@nestjs/common'
import { CreateBootcampDto } from './dto/create-bootcamp.dto'
import { UpdateBootcampDto } from './dto/update-bootcamp.dto'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BootcampService {
  constructor(private prisma: PrismaService) {}

  create(createBootcampDto: CreateBootcampDto) {
    return this.prisma.bootcamp.create({ data: createBootcampDto })
  }
  findAll() {
    return `This action returns all bootcamp`
  }

  findOne(id: number) {
    return `This action returns a #${id} bootcamp`
  }

  update(id: number, updateBootcampDto: UpdateBootcampDto) {
    return `This action updates a #${id} bootcamp`
  }

  remove(id: number) {
    return `This action removes a #${id} bootcamp`
  }
}
