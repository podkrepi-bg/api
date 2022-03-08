import { Injectable, NotFoundException } from '@nestjs/common'
import { Bootcamp } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBootcampDto } from './dto/create-bootcamp.dto'
import { UpdateBootcampDto } from './dto/update-bootcamp.dto'

@Injectable()
export class BootcampService {
  constructor(private prisma: PrismaService) {}

  async create(createBootcampDto: CreateBootcampDto): Promise<Bootcamp> {
    return await this.prisma.bootcamp.create({ data: createBootcampDto })
  }

  async findAll(): Promise<Bootcamp[]> {
    return await this.prisma.bootcamp.findMany()
  }

  async findOne(id: string): Promise<Bootcamp | null> {
    return await this.prisma.bootcamp.findFirst({
      where: { id: id },
    })
  }

  async update(id: string, updateBootcampDto: UpdateBootcampDto): Promise<Bootcamp | void> {
    try {
      const updatedTask = await this.prisma.bootcamp.update({
        where: {
          id: id,
        },
        data: {
          status: updateBootcampDto.status,
          title: updateBootcampDto.title,
          email: updateBootcampDto.email,
          message: updateBootcampDto.message,
          date: updateBootcampDto.date,
          firstName: updateBootcampDto.firstName,
          lastName: updateBootcampDto.lastName,
        },
      })
      return updatedTask
    } catch (error) {
      throw new NotFoundException('Requested task id does not exist!')
    }
  }

  async remove(id: string): Promise<string | void> {
    try {
      const deletedTask = await this.prisma.bootcamp.delete({ where: { id: id } })
      return `${deletedTask.title} Deleted Succesfully!`
    } catch (error) {
      throw new NotFoundException('Requested task id does not exist!')
    }
  }

  async removeMany(tasksToDelete: [string]): Promise<string | void> {
    try {
      await this.prisma.bootcamp.deleteMany({
        where: {
          id: {
            in: tasksToDelete,
          },
        },
      })
      return 'Deleted Succesfully!'
    } catch (error) {
      throw new NotFoundException('Requested task id does not exist!')
    }
  }
}
