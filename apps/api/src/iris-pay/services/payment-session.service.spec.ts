import { UnauthorizedException } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { Prisma } from '@prisma/client'

import { MockPrismaService, prismaMock } from '../../prisma/prisma-client.mock'
import { PaymentSessionPayload, PaymentSessionService } from './payment-session.service'

describe('PaymentSessionService', () => {
  let service: PaymentSessionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, JwtModule.register({})],
      providers: [PaymentSessionService, MockPrismaService],
    }).compile()

    service = module.get<PaymentSessionService>(PaymentSessionService)
  })

  describe('consumeSession', () => {
    const validPayload = (
      overrides: Partial<PaymentSessionPayload> = {},
    ): PaymentSessionPayload => ({
      step: 'initialSession',
      jti: 'jti-1',
      exp: Math.floor(Date.now() / 1000) + 300,
      ...overrides,
    })

    it('inserts a payment_sessions row with jti and exp-derived expiresAt', async () => {
      const payload = validPayload({ exp: 1_700_000_000 })
      prismaMock.paymentSession.create.mockResolvedValue({} as never)

      await service.consumeSession(payload)

      expect(prismaMock.paymentSession.create).toHaveBeenCalledWith({
        data: {
          jti: 'jti-1',
          expiresAt: new Date(1_700_000_000 * 1000),
        },
      })
    })

    it('throws UnauthorizedException("already used") when prisma raises P2002', async () => {
      prismaMock.paymentSession.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      )

      await expect(service.consumeSession(validPayload())).rejects.toMatchObject({
        message: 'Payment session already used',
      })
      await expect(service.consumeSession(validPayload())).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('rethrows non-P2002 prisma errors', async () => {
      const dbError = new Error('connection refused')
      prismaMock.paymentSession.create.mockRejectedValue(dbError)

      await expect(service.consumeSession(validPayload())).rejects.toBe(dbError)
    })

    it('throws Unauthorized when jti is missing', async () => {
      await expect(service.consumeSession(validPayload({ jti: undefined }))).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
      expect(prismaMock.paymentSession.create).not.toHaveBeenCalled()
    })

    it('throws Unauthorized when exp is missing', async () => {
      await expect(service.consumeSession(validPayload({ exp: undefined }))).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
      expect(prismaMock.paymentSession.create).not.toHaveBeenCalled()
    })
  })

  describe('purgeExpiredSessions', () => {
    it('deletes rows whose expiresAt is in the past', async () => {
      prismaMock.paymentSession.deleteMany.mockResolvedValue({ count: 3 })

      const result = await service.purgeExpiredSessions()

      expect(prismaMock.paymentSession.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } },
      })
      expect(result).toBe(3)
    })
  })
})
