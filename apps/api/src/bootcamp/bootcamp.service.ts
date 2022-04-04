import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBootcampDto } from './dto/create-bootcamp.dto'
import { DeleteManyBootcampDto } from './dto/delete-many-bootcamps.dto'
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
    return await this.prisma.bootcamp.findFirst({ where: { id } }).catch(() => {
      throw new NotFoundException('Bootcamp not found')
    })
  }

  async update(id: string, updateBootcampDto: UpdateBootcampDto) {
    return await this.prisma.bootcamp.update({ where: { id }, data: updateBootcampDto })
  }

  async remove(id: string) {
    const result = await this.prisma.bootcamp.delete({ where: { id } })

    if (!result) {
      throw new NotFoundException('Sorry Id not found.')
    }

    return result
  }

  async removeManyBootcamps(data: DeleteManyBootcampDto) {
    return await this.prisma.bootcamp.deleteMany({ where: { id: { in: data.ids } } })
  }
}
