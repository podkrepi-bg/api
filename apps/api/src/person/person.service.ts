import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import client from '@sendgrid/client'
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
      client.setApiKey(apiKey)
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

  async findAll() {
    return await this.prisma.person.findMany()
  }

  async findOne(id: string) {
    return await this.prisma.person.findFirst({ where: { id } })
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
      await client.request({
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
