import { Person, SupportRequest } from '.prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createSupportRequest(
    person: Pick<Person, 'firstName' | 'lastName' | 'email' | 'phone'>,
    supportData: SupportRequest['supportData']
  ): Promise<SupportRequest> {
    return this.prisma.supportRequest.create({
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
      },
      data: {
        person: {
          connectOrCreate: {
            create: person,
            where: { email: person.email },
          },
        },
        supportData,
      },
    });
  }
}
