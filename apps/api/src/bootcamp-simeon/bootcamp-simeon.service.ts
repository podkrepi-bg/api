import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBootcampSimeonDto } from './dto/create-bootcamp-simeon.dto'
import { UpdateBootcampSimeonDto } from './dto/update-bootcamp-simeon.dto'

@Injectable()
export class BootcampSimeonService {
  constructor(private readonly prisma: PrismaService) {}

  create(createBootcampSimeonDto: CreateBootcampSimeonDto) {
    return 'This action adds a new bootcampSimeon'
  }

  findAll() {
    return `This action returns all bootcampSimeon`
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
