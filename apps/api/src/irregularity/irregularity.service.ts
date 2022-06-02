import { Injectable, NotFoundException } from '@nestjs/common'
import { Irregularity } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { IrregularityFileService } from '../irregularity-file/irregularity-file.service'
import { CreateIrregularityDto } from './dto/create-irregularity.dto'
import { UpdateIrregularityDto } from './dto/update-irregularity.dto'

@Injectable()
export class IrregularityService {
  constructor(
    private prisma: PrismaService,
    private irregularityFileService: IrregularityFileService,
  ) {}
  async create(inputDto: CreateIrregularityDto): Promise<Pick<Irregularity, 'id' | 'personId'>> {
    const irregularity = await this.prisma.irregularity.create({ data: inputDto.toEntity() })

    return {
      id: irregularity.id,
      personId: irregularity.personId,
    }
  }

  async update(id: string, updateDto: UpdateIrregularityDto): Promise<Irregularity | null> {
    const person = await this.prisma.person.update({
      where: { id: updateDto.personId },
      data: updateDto.person,
    })
    if (!person) throw new NotFoundException('Not found')

    const result = await this.prisma.irregularity.update({
      where: { id: id },
      data: updateDto.toEntity(),
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async listIrregularities(): Promise<Irregularity[]> {
    return await this.prisma.irregularity.findMany({
      include: {
        person: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        campaign: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getIrregularityById(id: string): Promise<Irregularity | null> {
    const result = await this.prisma.irregularity.findUnique({
      where: { id },
      include: {
        person: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        campaign: { select: { id: true, title: true } },
      },
    })
    if (!result) throw new NotFoundException('Not found campaign irregularity with ID: ' + id)
    return result
  }

  async removeIrregularityById(id: string): Promise<Irregularity | null> {
    const files = await this.prisma.irregularityFile.findMany({
      where: { irregularityId: id },
    })
    await Promise.all(
      files.map((file) => {
        return this.irregularityFileService.remove(file.id)
      }),
    )
    const result = await this.prisma.irregularity.delete({
      where: { id: id },
    })
    if (!result) throw new NotFoundException('Not found campaign irregularity with ID: ' + id)
    console.log('deleted irregularity and files')
    return result
  }
}
