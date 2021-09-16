import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { BeneficiaryController } from './beneficiary.controller'
import { BeneficiaryService } from './beneficiary.service'

describe('BeneficiaryController', () => {
  let controller: BeneficiaryController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BeneficiaryController],
      providers: [BeneficiaryService, PrismaService],
    }).compile()

    controller = module.get<BeneficiaryController>(BeneficiaryController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
