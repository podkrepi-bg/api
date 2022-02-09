import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBootcampDto } from "./dto/create-bootcamp.dto";
import { UpdateBootcampDto } from "./dto/update-bootcamp.dto";

@Injectable()
export class BootcampService {
  constructor(private prisma: PrismaService) { }

  async create(createBootcampDto: CreateBootcampDto) {
    const res = await this.prisma.bootcamp.create({ data: createBootcampDto });

    return res.id;
  }

  async findAll() {
    return await this.prisma.bootcamp.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.bootcamp.findFirst({ where: { id: id } });
  }

  async update(id: string, updateBootcampDto: UpdateBootcampDto) {
    await this.prisma.bootcamp.update({
      where: { id },
      data: updateBootcampDto,
    });
    return await this.prisma.bootcamp.findUnique({ where: { id } });
  }

  async remove(id: string) {
    await this.prisma.bootcamp.delete({ where: { id } });
  }

  async searchByPhone(keyword: string) {
    const data = await this.prisma.bootcamp.findMany({})
    return data.filter(x => x.phone.toLowerCase().includes(keyword.toLowerCase()))
  }

  async searchByName(keyword: string) {
    const data = await this.prisma.bootcamp.findMany({})
    return data.filter(x => x.MyName.toLowerCase().includes(keyword.toLowerCase()))
  }

  async searchByEmail(keyword: string) {
    const data = await this.prisma.bootcamp.findMany({})
    return data.filter(x => x.email.toLowerCase().includes(keyword.toLowerCase()))
  }

  async searchByAdress(keyword: string) {
    const data = await this.prisma.bootcamp.findMany({})
    return data.filter(x => x.adress.toLowerCase().includes(keyword.toLowerCase()))
  }
}
