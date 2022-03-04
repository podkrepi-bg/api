import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { BootcampSimeonController } from './bootcamp-simeon.controller'
import { BootcampSimeonService } from './bootcamp-simeon.service'

describe('BootcampSimeonController', () => {
  let controller: BootcampSimeonController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BootcampSimeonController],
      providers: [BootcampSimeonService, PrismaService],
    }).compile()

    controller = module.get<BootcampSimeonController>(BootcampSimeonController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
