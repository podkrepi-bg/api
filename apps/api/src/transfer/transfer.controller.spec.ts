import { Test, TestingModule } from '@nestjs/testing'

import { TransferService } from './transfer.service'
import { TransferController } from './transfer.controller'

describe('TransferController', () => {
  let controller: TransferController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [TransferService],
    }).compile()

    controller = module.get<TransferController>(TransferController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
