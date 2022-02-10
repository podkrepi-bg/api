import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePersonDto } from './dto/create-person.dto'
import { UpdatePersonDto } from './dto/update-person.dto'

@Injectable()
export class PersonService {
  constructor(private prisma: PrismaService) {}

  async create(createPersonDto: CreatePersonDto) {
    return await this.prisma.person.create({ data: createPersonDto })
  }

  async findAll() {
    return await this.prisma.person.findMany()
  }

  async findOne(id: string) {
    return await this.prisma.person.findFirst({ where: { id } })
  }

  async update(id: string, updatePersonDto: UpdatePersonDto) {
    return await this.prisma.person.update({ data: updatePersonDto, where: { id } })
  }

  async remove(id: string) {
    return await this.prisma.person.delete({
      where: { id },
      include: {
        expenses: true,
        documents: true,
        transfers: true,
        campaigns: true,
        supporters: true,
        benefactors: true,
        beneficiaries: true,
        withdrawals: true,
        infoRequests: true,
        coordinators: true,
        recurringDonations: true,
      },
    })
  }
}
