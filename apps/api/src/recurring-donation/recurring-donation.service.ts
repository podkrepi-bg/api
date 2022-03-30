import { Injectable, NotFoundException } from '@nestjs/common'
import { RecurringDonation } from '@prisma/client'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto'
import { UpdateRecurringDonationDto } from './dto/update-recurring-donation.dto'

@Injectable()
export class RecurringDonationService {
  constructor(private prisma: PrismaService) {}

  async create(CreateRecurringDonationDto: CreateRecurringDonationDto): Promise<RecurringDonation> {
    return await this.prisma.recurringDonation.create({
      data: CreateRecurringDonationDto.toEntity(),
    })
  }

  async findAll(): Promise<RecurringDonation[]> {
    return await this.prisma.recurringDonation.findMany()
  }

  async findOne(id: string): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.findUnique({
      where: { id },
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async update(
    id: string,
    updateRecurringDonationDto: UpdateRecurringDonationDto,
  ): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.update({
      where: { id: id },
      data: updateRecurringDonationDto,
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async remove(id: string): Promise<RecurringDonation | null> {
    const result = await this.prisma.recurringDonation.delete({ where: { id: id } })
    if (!result) throw new NotFoundException('Not found')
    return result
  }
}
