import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { BankAccountController } from './bankaccount.controller'
import { BankAccountService } from './bankaccount.service'

describe('BankaccountController', () => {
  let controller: BankAccountController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankAccountController],
      providers: [MockPrismaService, BankAccountService],
    }).compile()

    controller = module.get<BankAccountController>(BankAccountController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
