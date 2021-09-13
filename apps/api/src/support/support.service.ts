import { Injectable } from '@nestjs/common';
import { ContactRequest, Prisma, SupportRequest } from '.prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createSupportRequest(
    person: Prisma.PersonCreateWithoutSupportRequestInput,
    supportData: Prisma.SupportRequestCreateInput['supportData']
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

  async createSupportInquiry(
    person: Prisma.PersonCreateWithoutContactRequestInput,
    message: ContactRequest['message']
  ): Promise<ContactRequest> {
    return this.prisma.contactRequest.create({
      select: {
        id: true,
        person: false,
        personId: true,
        message: true,
        createdAt: true,
        deletedAt: true,
        updatedAt: true,
      },
      data: {
        person: {
          connectOrCreate: {
            create: person,
            where: { email: person.email },
          },
        },
        message,
      },
    });
  }
}
