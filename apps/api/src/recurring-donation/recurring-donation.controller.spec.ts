import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { RecurringDonationController } from './recurring-donation.controller'
import { RecurringDonationService } from './recurring-donation.service'
import { HttpService } from '@nestjs/axios'
import { mockDeep } from 'jest-mock-extended'
import Stripe from 'stripe'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'

describe('RecurringDonationController', () => {
  let controller: RecurringDonationController

  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
  }
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringDonationController],
      providers: [
        RecurringDonationService,
        MockPrismaService,
        ConfigService,
        {
          provide: HttpService,
          useValue: mockDeep<HttpService>(),
        },
        Stripe,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
      ],
    }).compile()

    controller = module.get<RecurringDonationController>(RecurringDonationController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
