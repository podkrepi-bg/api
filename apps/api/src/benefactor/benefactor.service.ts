import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateBenefactorDto } from './dto/create-benefactor.dto'
import { UpdateBenefactorDto } from './dto/update-benefactor.dto'
import { Benefactor } from '@prisma/client'
import { BenefactorModule } from './benefactor.module'
import { PrismaService } from '../prisma/prisma.service'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'

@Injectable()
export class BenefactorService {
  constructor(private prisma: PrismaService) {}

  async create(createBenefactorDto: CreateBenefactorDto) {
    return await this.prisma.benefactor.create({ data: createBenefactorDto })
  }

  async findAll(): Promise<Benefactor[]> {
    return await this.prisma.benefactor.findMany()
  }

  async findOne(id: string): Promise<Benefactor> {
    try {
      return await this.prisma.benefactor.findFirst({
        where: {
          id,
        },
        rejectOnNotFound: true,
      })
    } catch (err) {
      const msg = `No Document found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  async update(id: string, updateBenefactorDto: UpdateBenefactorDto) {
    try {
      const result = await this.prisma.benefactor.update({
        where: { id },
        data: {
          extCustomerId: updateBenefactorDto.extCustomerId,
        },
      })
      return result
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        Logger.warn('No record with id', +id)
        throw new NotFoundException('No record with id' + id)
      }
    }
  }

  async remove(id: string): Promise<Benefactor> {
    try {
      return await this.prisma.benefactor.delete({
        where: {
          id,
        },
      })
    } catch (err) {
      const msg = `Delete failed. No Benefactor found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }
}
