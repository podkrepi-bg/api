import { Test, TestingModule } from '@nestjs/testing'
import { prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { CoordinatorService } from './coordinator.service'

describe('CoordinatorService', () => {
  let service: CoordinatorService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoordinatorService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile()

    service = module.get<CoordinatorService>(CoordinatorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
