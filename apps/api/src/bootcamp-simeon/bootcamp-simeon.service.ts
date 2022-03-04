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

  findOne(id: string) {
    return this.prisma.bootcampSimeon.findFirst({where: {id}})
  }

  update(id: string, updateBootcampSimeonDto: UpdateBootcampSimeonDto) {
    return this.prisma.bootcampSimeon.update({
      where: { id },
      data: { ...updateBootcampSimeonDto }
    })
  }

  remove(id: string) {
    return this.prisma.bootcampSimeon.delete({where: {id}})
  }
}
