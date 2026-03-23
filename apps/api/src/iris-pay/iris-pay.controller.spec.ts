import { Test, TestingModule } from '@nestjs/testing'
import { IrisPayController } from './iris-pay.controller'
import { IrisPayService } from './iris-pay.service'
import { PaymentSessionService } from './services/payment-session.service'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { JwtModule } from '@nestjs/jwt'

describe('IrisPayController', () => {
  let controller: IrisPayController

  const mockIrisPayService = {
    createCheckout: jest.fn(),
    verifyPayment: jest.fn(),
    finishPaymentSession: jest.fn(),
  }

  const mockPaymentSessionService = {
    createInitialSession: jest.fn(),
    validateSession: jest.fn(),
    upgradeSession: jest.fn(),
    clearSession: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule, JwtModule.register({})],
      controllers: [IrisPayController],
      providers: [
        { provide: IrisPayService, useValue: mockIrisPayService },
        { provide: PaymentSessionService, useValue: mockPaymentSessionService },
      ],
    }).compile()

    controller = module.get<IrisPayController>(IrisPayController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
