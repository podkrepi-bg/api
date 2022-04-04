import { Test, TestingModule } from '@nestjs/testing'

import { TransferService } from './transfer.service'
import { TransferController } from './transfer.controller'
import { MockPrismaService } from '../prisma/prisma-client.mock'

describe('TransferController', () => {
  let controller: TransferController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [TransferService, MockPrismaService],
    }).compile()

    controller = module.get<TransferController>(TransferController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
