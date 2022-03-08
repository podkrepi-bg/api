import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { WithdrawalController } from './withdrawal.controller'
import { WithdrawalService } from './withdrawal.service'

describe('WithdrawalController', () => {
  let controller: WithdrawalController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithdrawalController],
      providers: [WithdrawalService, PrismaService],
    }).compile()

    controller = module.get<WithdrawalController>(WithdrawalController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
