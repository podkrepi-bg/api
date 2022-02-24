import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { VaultController } from './vault.controller'
import { VaultService } from './vault.service'

describe('VaultController', () => {
  let controller: VaultController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VaultController],
      providers: [VaultService, PrismaService],
    }).compile()

    controller = module.get<VaultController>(VaultController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
