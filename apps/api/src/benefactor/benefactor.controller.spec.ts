import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { BenefactorController } from './benefactor.controller'
import { BenefactorService } from './benefactor.service'

describe('BenefactorController', () => {
  let controller: BenefactorController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BenefactorController],
      providers: [BenefactorService, MockPrismaService],
    }).compile()

    controller = module.get<BenefactorController>(BenefactorController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
