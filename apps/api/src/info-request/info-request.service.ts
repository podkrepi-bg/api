import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInfoRequestDto } from './dto/create-info-request.dto';
import { UpdateInfoRequestDto } from './dto/update-info-request.dto';

@Injectable()
export class InfoRequestService {
  constructor(private prisma: PrismaService){}

  create(createInfoRequestDto: CreateInfoRequestDto, personId: string) {
    return this.prisma.infoRequest.create({ data: { ...createInfoRequestDto, personId: personId}})
  }

  findAll() {
    return this.prisma.infoRequest.findMany({ include: { person: true}});
  }

  findOne(id: string) {
    return this.prisma.infoRequest.findUnique({where: {id}, include: {person: true}});
  }

  update(id: string, updateInfoRequestDto: UpdateInfoRequestDto) {
    return this.prisma.infoRequest.update({ where: { id }, data: { ...updateInfoRequestDto}});
  }

  remove(id: string) {
    return this.prisma.infoRequest.delete({where: {id}});
  }
}
