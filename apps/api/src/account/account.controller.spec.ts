import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'

describe('AccountController', () => {
  let controller: AccountController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [AccountService, PersonService, PrismaService, ConfigService],
    }).compile()

    controller = module.get<AccountController>(AccountController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
