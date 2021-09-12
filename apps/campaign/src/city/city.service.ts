import { City, PrismaClient } from '.prisma/client';
import { Injectable } from '@nestjs/common';

const prisma = new PrismaClient();

@Injectable()
export class CityService {
  listCities(): Promise<City[]> {
    return prisma.city.findMany();
  }
}
