import { Injectable } from '@nestjs/common'
import { CreateTikvaDto } from './dto/create-tikva.dto'
import { UpdateTikvaDto } from './dto/update-tikva.dto'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TikvaService {
  constructor(private prisma: PrismaService) {}

  create(createTikvaDto: CreateTikvaDto) {
    return this.prisma.tikva.create({ data: createTikvaDto })
  }

  findAll() {
    return `{ Tikva }`
  }

  findOne(id: number) {
    return `This action returns a #${id} tikva`
  }

  update(id: number, updateTikvaDto: UpdateTikvaDto) {
    return `This action updates a #${id} tikva`
  }

  remove(id: number) {
    return `This action removes a #${id} tikva`
  }
}
