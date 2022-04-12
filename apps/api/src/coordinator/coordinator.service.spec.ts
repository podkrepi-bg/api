import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CoordinatorService } from './coordinator.service'

describe('CoordinatorService', () => {
  let service: CoordinatorService
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoordinatorService, MockPrismaService, PersonService, ConfigService],
    }).compile()
    service = module.get<CoordinatorService>(CoordinatorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return all', async () => {})

  describe('Find one', () => {
    it('should return searching coordinator', async () => {})
  })

  describe('delete', () => {
    it('should delete', async () => {})
  })
})
