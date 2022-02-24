import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { PersonController } from './person.controller'
import { PersonService } from './person.service'

describe('PersonController', () => {
  let controller: PersonController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonController],
      providers: [PersonService, PrismaService],
    }).compile()

    controller = module.get<PersonController>(PersonController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
