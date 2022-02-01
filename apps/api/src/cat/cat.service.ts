import { Injectable } from '@nestjs/common'
import { CreateCatDto } from './dto/create-cat.dto'
import { UpdateCatDto } from './dto/update-cat.dto'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CatService {
  constructor(private prisma: PrismaService) {}
  create(createCatDto: CreateCatDto) {
    return this.prisma.cat.create({ data: createCatDto })
  }

  findAll() {
    return `This action returns all cat`
  }

  findOne(id: number) {
    return `This action returns a #${id} cat`
  }

  update(id: number, updateCatDto: UpdateCatDto) {
    return `This action updates a #${id} cat`
  }

  remove(id: number) {
    return `This action removes a #${id} cat`
  }
}
