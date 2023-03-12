import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { ExpensesService } from './expenses.service'
import { S3Service } from '../s3/s3.service'

describe('ExpensesService', () => {
  let service: ExpensesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockPrismaService, ExpensesService, S3Service],
    }).compile()

    service = module.get<ExpensesService>(ExpensesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
