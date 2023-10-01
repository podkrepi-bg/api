import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import mailClient from '@sendgrid/client'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePersonDto } from './dto/create-person.dto'
import { UpdatePersonDto } from './dto/update-person.dto'

@Injectable()
export class PersonService {
  private enabled = true
  private contactsUrl: string

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.contactsUrl = config.get<string>('sendgrid.contactsUrl') as string
    const apiKey = config.get<string>('sendgrid.apiKey')

    if (apiKey && this.contactsUrl) {
      mailClient.setApiKey(apiKey)
    } else {
      this.enabled = false
      Logger.warn('no apiKey or contactsUrl for sendgrid, will not add user to the contact list')
    }
  }

  async create(createPersonDto: CreatePersonDto) {
    const person = await this.prisma.person.create({ data: createPersonDto })
    if (createPersonDto.newsletter && this.enabled) {
      await this.addToContactList(createPersonDto)
    }
    return person
  }

  async findAll(
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    pageIndex?: number,
    pageSize?: number,
  ) {
    const whereClause: Prisma.PersonWhereInput = {
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    }

    let sort: Prisma.PersonOrderByWithRelationInput = { createdAt: 'desc' }

    if (sortBy)
      switch (sortBy) {
        case 'organizer':
          sort = { organizer: { createdAt: sortOrder == 'asc' ? 'asc' : 'desc' } }
          break
        case 'coordinators':
          sort = { coordinators: { createdAt: sortOrder == 'asc' ? 'asc' : 'desc' } }
          break
        case 'beneficiaries':
          sort = { beneficiaries: { _count: sortOrder == 'asc' ? 'desc' : 'asc' } }
          break
        default:
          sort = { [sortBy]: sortOrder ?? 'desc' }
      }

    const data = await this.prisma.person.findMany({
      skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
      take: pageSize ? pageSize : undefined,
      where: whereClause,
      orderBy: [sort],
      include: {
        organizer: { select: { id: true } },
        coordinators: { select: { id: true } },
        beneficiaries: { select: { id: true } },
      },
    })

    const count = await this.prisma.person.count({
      where: whereClause,
    })

    const result = {
      items: data,
      total: count,
    }

    return result
  }

  async findOne(id: string) {
    return await this.prisma.person.findFirst({
      where: { id },
      include: {
        organizer: { select: { id: true, _count: { select: { campaigns: true } } } },
        coordinators: { select: { id: true, _count: { select: { campaigns: true } } } },
        beneficiaries: {
          select: {
            id: true,
            countryCode: true,
            cityId: true,
            description: true,
            organizerRelation: true,
            _count: { select: { campaigns: true } },
          },
        },
      },
    })
  }

  async findByEmail(email: string) {
    return await this.prisma.person.findFirst({ where: { email } })
  }

  async findOneByKeycloakId(keycloakId: string) {
    return await this.prisma.person.findFirst({ where: { keycloakId } })
  }

  async update(id: string, updatePersonDto: UpdatePersonDto) {
    return await this.prisma.person.update({ where: { id }, data: updatePersonDto })
  }

  async remove(id: string) {
    return await this.prisma.person.delete({ where: { id } })
  }

  private async addToContactList(createPersonDto: CreatePersonDto) {
    const data = {
      contacts: [
        {
          email: createPersonDto.email,
          first_name: createPersonDto.firstName,
          last_name: createPersonDto.lastName,
        },
      ],
    }

    try {
      await mailClient.request({
        url: this.contactsUrl,
        method: 'PUT',
        body: data,
      })
    } catch (error) {
      Logger.warn(`Adding person to contacts list failed with code: ${error.code}`)
    }
  }

  // Create/Update a marketing notifications consent for emails that are not registered
  async updateUnregisteredNotificationConsent(email: string, consent: boolean) {
    await this.prisma.unregisteredNotificationConsent.update({
      data: { consent },
      where: {
        email,
      },
    })
  }
}
