import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { PersonService } from './person.service'

describe('PersonService', () => {
  let service: PersonService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonService, MockPrismaService],
    }).compile()

    service = module.get<PersonService>(PersonService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
