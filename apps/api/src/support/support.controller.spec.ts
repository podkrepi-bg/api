import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { SupportController } from './support.controller'
import { SupportService } from './support.service'

describe('SupportController', () => {
  let controller: SupportController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [SupportService, PrismaService],
    }).compile()

    controller = module.get<SupportController>(SupportController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
