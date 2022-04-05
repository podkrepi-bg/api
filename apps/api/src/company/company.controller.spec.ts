import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CompanyController } from './company.controller'
import { CompanyService } from './company.service'

describe('CompanyController', () => {
  let controller: CompanyController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [CompanyService, MockPrismaService],
    }).compile()

    controller = module.get<CompanyController>(CompanyController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
