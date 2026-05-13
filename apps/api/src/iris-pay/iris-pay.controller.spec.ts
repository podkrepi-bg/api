import { Test, TestingModule } from '@nestjs/testing'
import { IrisPayController } from './iris-pay.controller'
import { IrisPayService } from './iris-pay.service'
import { PaymentSessionService } from './services/payment-session.service'
import { PaymentSessionGuard } from './guards/payment-session.guard'
import { Reflector } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { JwtModule } from '@nestjs/jwt'
import { PaymentStatus } from '@prisma/client'
import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'

describe('IrisPayController', () => {
  let controller: IrisPayController

  const mockIrisPayService = {
    createCheckout: jest.fn(),
    verifyPayment: jest.fn(),
    finishPaymentSession: jest.fn(),
    finalizePayment: jest.fn(),
    verifySignedState: jest.fn(),
  }

  const mockPaymentSessionService = {
    createInitialSession: jest.fn(),
    validateSession: jest.fn(),
    consumeSession: jest.fn(),
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
        { provide: PaymentSessionGuard, useValue: { canActivate: () => true } },
        Reflector,
      ],
    }).compile()

    controller = module.get<IrisPayController>(IrisPayController)
  })

  afterEach(() => jest.clearAllMocks())

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('/finalize', () => {
    const paymentId = '11111111-1111-1111-1111-111111111111'
    const reqWithSession = { paymentSession: { paymentId } } as unknown as any
    const res = {} as unknown as any

    it('returns status+donationId on success and clears session', async () => {
      mockIrisPayService.finalizePayment.mockResolvedValue({
        status: PaymentStatus.succeeded,
        donationId: 'don-1',
        reason: '',
      })

      const result = await controller.finalize(reqWithSession, res)

      expect(mockIrisPayService.finalizePayment).toHaveBeenCalledWith(paymentId)
      expect(mockPaymentSessionService.clearSession).toHaveBeenCalledWith(res)
      expect(result).toEqual({
        status: PaymentStatus.succeeded,
        donationId: 'don-1',
        reason: '',
      })
    })

    it('throws 404 and clears session when JWT has no paymentId', async () => {
      const req = { paymentSession: {} } as unknown as any
      await expect(controller.finalize(req, res)).rejects.toBeInstanceOf(NotFoundException)
      expect(mockPaymentSessionService.clearSession).toHaveBeenCalled()
    })

    it('throws ServiceUnavailable and keeps session on iris_unavailable', async () => {
      mockIrisPayService.finalizePayment.mockRejectedValue(
        new ServiceUnavailableException('iris_unavailable'),
      )
      await expect(controller.finalize(reqWithSession, res)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      )
      expect(mockPaymentSessionService.clearSession).not.toHaveBeenCalled()
    })

    it('throws Conflict on currency_mismatch and clears session', async () => {
      mockIrisPayService.finalizePayment.mockRejectedValue(
        new ConflictException('currency_mismatch'),
      )
      await expect(controller.finalize(reqWithSession, res)).rejects.toBeInstanceOf(
        ConflictException,
      )
      expect(mockPaymentSessionService.clearSession).toHaveBeenCalled()
    })

    it('throws NotFound on unknown_payment and clears session', async () => {
      mockIrisPayService.finalizePayment.mockRejectedValue(new NotFoundException('unknown_payment'))
      await expect(controller.finalize(reqWithSession, res)).rejects.toBeInstanceOf(
        NotFoundException,
      )
      expect(mockPaymentSessionService.clearSession).toHaveBeenCalled()
    })
  })

  describe('/webhook', () => {
    const makeReq = () =>
      ({
        method: 'GET',
        originalUrl: '/api/v1/iris-pay/webhook',
        body: {},
      } as unknown as any)

    it('verifies the signed state and calls finalizePayment with the decoded paymentId', async () => {
      mockIrisPayService.verifySignedState.mockReturnValue('payment-id-1')
      mockIrisPayService.finalizePayment.mockResolvedValue({
        status: PaymentStatus.succeeded,
        donationId: 'don-1',
      })
      const result = await controller.webhookEndpoint(
        { state: 'payment-id-1.signature' },
        { 'x-iris-event-type': 'PAYMENT_STARTED' },
        makeReq(),
      )
      expect(mockIrisPayService.verifySignedState).toHaveBeenCalledWith('payment-id-1.signature')
      expect(mockIrisPayService.finalizePayment).toHaveBeenCalledWith('payment-id-1')
      expect(result).toEqual({ ok: true })
    })

    it('returns 200 without finalizing when the signature is invalid', async () => {
      mockIrisPayService.verifySignedState.mockImplementation(() => {
        throw new UnauthorizedException('Invalid webhook signature')
      })
      const result = await controller.webhookEndpoint(
        { state: 'payment-id-1.wrong-sig' },
        {},
        makeReq(),
      )
      expect(mockIrisPayService.finalizePayment).not.toHaveBeenCalled()
      expect(result).toEqual({ ok: true })
    })

    it('swallows finalize errors and still returns 200 so IRIS does not spam retries', async () => {
      mockIrisPayService.verifySignedState.mockReturnValue('payment-id-2')
      mockIrisPayService.finalizePayment.mockRejectedValue(new Error('boom'))
      const result = await controller.webhookEndpoint(
        { state: 'payment-id-2.signature' },
        {},
        makeReq(),
      )
      expect(result).toEqual({ ok: true })
    })

    it('does not verify or finalize when state is missing', async () => {
      const result = await controller.webhookEndpoint({}, {}, makeReq())
      expect(mockIrisPayService.verifySignedState).not.toHaveBeenCalled()
      expect(mockIrisPayService.finalizePayment).not.toHaveBeenCalled()
      expect(result).toEqual({ ok: true })
    })
  })
})
