import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { OrganizerService } from './organizer.service'

describe('OrganizerService', () => {
  let service: OrganizerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizerService, MockPrismaService, PersonService, ConfigService],
    }).compile()

    service = module.get<OrganizerService>(OrganizerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
