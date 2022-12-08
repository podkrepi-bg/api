import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { mockDeep } from 'jest-mock-extended'
import { RecurringDonationService } from './recurring-donation.service'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import Stripe from 'stripe'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'

describe('RecurringDonationService', () => {
  let service: RecurringDonationService

  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<RecurringDonationService>(RecurringDonationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
