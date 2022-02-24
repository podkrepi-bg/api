import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from './vault.service'

describe('VaultService', () => {
  let service: VaultService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VaultService, PrismaService],
    }).compile()

    service = module.get<VaultService>(VaultService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
