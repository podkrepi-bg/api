import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Document } from '@prisma/client';
import { CreateBenefactorDto } from './dto/create-benefactor.dto';
import { UpdateBenefactorDto } from './dto/update-benefactor.dto';
import { Benefactor } from '@prisma/client';
import { BenefactorModule } from './benefactor.module';
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BenefactorService {
  constructor(private prisma: PrismaService) {}

  async create(createBenefactorDto: CreateBenefactorDto) {
    return await this.prisma.benefactor.create({ data: createBenefactorDto.toEntity() })
    
  }

  async findAll(): Promise<Benefactor[]> {
    return await this.prisma.benefactor.findMany();
  }

  async findOne(id: string): Promise<Benefactor> {
    try {
      return await this.prisma.benefactor.findFirst({
        where: {
          id
        },
        rejectOnNotFound: true
      });
    } catch (err) {
      const msg = `No Document found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} benefactor`;
  // }

  async update(id: string, updateBenefactorDto: UpdateBenefactorDto): Promise<Benefactor> {
    try {
      return await this.prisma.benefactor.update({
        where: {
          id
        },
        data: {
          // id: updateBenefactorDto.id,
          extCustomerId: updateBenefactorDto.extCustomerId,
          createdAt: updateBenefactorDto.createdAt,
          updatedAt: updateBenefactorDto.updatedAt,
          // person: updateBenefactorDto.person,
          
        }
      });
    } catch (err) {
      const msg = `Update failed. No Document found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }


  // update(id: number, updateBenefactorDto: UpdateBenefactorDto) {
  //   return `This action updates a #${id} benefactor`;
  // }

  async remove(id: string): Promise<Benefactor> {
    try {

      return await this.prisma.benefactor.delete({
        where: {
          id
        }
      })
    } catch (err) {
      const msg = `Delete failed. No Benefactor found with ID: ${id}`

      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }

  // remove(id: number) {
  //   return `This action removes a #${id} benefactor`;
  // }
}
