import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrganizerDto } from './dto/create-organizer.dto'

@Injectable()
export class OrganizerService {
  constructor(private prisma: PrismaService) {}

  create(createOrganizerDto: CreateOrganizerDto) {
    return this.prisma.organizer.create({ data: createOrganizerDto })
  }

  findAll() {
    return this.prisma.organizer.findMany({
      include: {
        person: { include: { company: { select: { id: true, companyName: true } } } },
        campaigns: { select: { id: true, slug: true } },
      },
    })
  }

  findOne(id: string) {
    return this.prisma.organizer.findUnique({
      where: { id },
      include: {
        person: true,
        campaigns: { select: { id: true, slug: true } },
      },
    })
  }

  remove(id: string) {
    return this.prisma.organizer.delete({ where: { id } })
  }
}
