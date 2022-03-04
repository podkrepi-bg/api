import { Test, TestingModule } from '@nestjs/testing'
import { prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'

import { CountryService } from './country.service'

describe('CountryService', () => {
  let service: CountryService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountryService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile()

    service = module.get<CountryService>(CountryService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
