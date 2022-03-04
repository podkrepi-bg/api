import { Injectable } from '@nestjs/common'
import { CreateBootcampSimeonDto } from './dto/create-bootcamp-simeon.dto'
import { UpdateBootcampSimeonDto } from './dto/update-bootcamp-simeon.dto'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BootcampSimeonService {
  constructor(private readonly prisma: PrismaService) {}

  create(createBootcampSimeonDto: CreateBootcampSimeonDto) {
    return this.prisma.bootcampSimeon.create({ data: createBootcampSimeonDto })
  }

  findAll() {
    return this.prisma.bootcampSimeon.findMany()
  }

  findOne(id: number) {
    return `This action returns a #${id} bootcampSimeon`
  }

  update(id: number, updateBootcampSimeonDto: UpdateBootcampSimeonDto) {
    return `This action updates a #${id} bootcampSimeon`
  }

  remove(id: number) {
    return `This action removes a #${id} bootcampSimeon`
  }
}
