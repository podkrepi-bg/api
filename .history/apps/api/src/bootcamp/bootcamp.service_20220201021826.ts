import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateBootcampDto } from './dto/create-bootcamp.dto'
import { UpdateBootcampDto } from './dto/update-bootcamp.dto'
import { PrismaService } from '../prisma/prisma.service'
import { Bootcamp, Prisma } from '@prisma/client'

@Injectable()
export class BootcampService {
  constructor(private prisma: PrismaService) { }

  async createBootcamp(createBootcampDto: CreateBootcampDto): Promise<Bootcamp> {
    return this.prisma.bootcamp.create({ data: createBootcampDto.toEntity() })
  }
  async listBootcamp(): Promise<Bootcamp[]> {
    return this.prisma.bootcamp.findMany()
  }

  async listOne(bootcampId: string): Promise<Bootcamp> {
    //FIND UNIQUE bootcampId: Prisma.BootcampWhereUniqueInput
    // const bootcamp = await this.prisma.bootcamp.findUnique({ where: { id: bootcampId } })
    const bootcamp = await this.prisma.bootcamp.findFirst({ where: { id: bootcampId } })
    if (!bootcamp) {
      Logger.warn('No campaign record with ID: ' + bootcampId)
      throw new NotFoundException('No campaign record with ID: ' + bootcampId)
    }
    return bootcamp
  }

  async updateBootcamp(id: string, updateBootcampDto: UpdateBootcampDto) {
    try{
      return await this.prisma.bootcamp.update({
        where: { id },
        data: updateBootcampDto
      })
    }catch(err) {
      const message = 'Update failed!'
      Logger.warn(message)
      throw new NotFoundException(err)
    }
  }

  async removeBootcamp(bootcampId: string) {
    return await this.prisma.bootcamp.delete({ where: { id: bootcampId } })
  }
}
