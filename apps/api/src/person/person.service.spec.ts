import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { PersonService } from './person.service'

describe('PersonService', () => {
  let service: PersonService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonService, PrismaService],
    }).compile()

    service = module.get<PersonService>(PersonService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
