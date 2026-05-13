import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { Request, Response } from 'express'

import { PrismaService } from '../../prisma/prisma.service'

export interface PaymentSessionPayload {
  step: 'initialSession' | 'paymentSessionCreated'
  jti?: string
  paymentId?: string
  exp?: number
}

const COOKIE_NAME = 'payment_jwt'
const SESSION_TTL_SECONDS = 5 * 60 // 5 minutes

@Injectable()
export class PaymentSessionService {
  private readonly secret: string

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {
    this.secret = this.configService.get<string>('iris.paymentSessionSecret', '')
  }

  createInitialSession(res: Response): void {
    const payload: PaymentSessionPayload = { step: 'initialSession', jti: randomUUID() }
    const token = this.jwtService.sign(payload, {
      secret: this.secret,
      expiresIn: SESSION_TTL_SECONDS,
    })
    this.setCookie(res, token)
  }

  validateSession(req: Request, expectedStep: string): PaymentSessionPayload {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) {
      throw new UnauthorizedException('Missing payment session')
    }

    let payload: PaymentSessionPayload
    try {
      payload = this.jwtService.verify<PaymentSessionPayload>(token, {
        secret: this.secret,
        algorithms: ['HS256'],
      })
    } catch {
      throw new UnauthorizedException('Invalid or expired payment session')
    }

    if (payload.step !== expectedStep) {
      throw new UnauthorizedException(
        `Invalid payment session step: expected '${expectedStep}', got '${payload.step}'`,
      )
    }

    return payload
  }

  // Single-use guard backed by a Postgres row keyed on the JWT's `jti`. The
  // create() call is atomic on the PK, so a second attempt with the same jti
  // raises P2002 — translated to 401 — even when racing across replicas.
  async consumeSession(payload: PaymentSessionPayload): Promise<void> {
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid payment session: missing jti')
    }
    if (!payload.exp) {
      throw new UnauthorizedException('Invalid payment session: missing exp')
    }

    const expiresAt = new Date(payload.exp * 1000)

    try {
      await this.prisma.paymentSession.create({
        data: { jti: payload.jti, expiresAt },
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new UnauthorizedException('Payment session already used')
      }
      throw err
    }
  }

  async purgeExpiredSessions(): Promise<number> {
    const { count } = await this.prisma.paymentSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    if (count > 0) {
      Logger.debug(`Purged ${count} expired payment session(s)`)
    }
    return count
  }

  upgradeSession(res: Response, data: { paymentId: string }): void {
    const payload: PaymentSessionPayload = {
      step: 'paymentSessionCreated',
      jti: randomUUID(),
      paymentId: data.paymentId,
    }
    const token = this.jwtService.sign(payload, {
      secret: this.secret,
      expiresIn: SESSION_TTL_SECONDS,
    })
    this.setCookie(res, token)
  }

  clearSession(res: Response): void {
    res.clearCookie(COOKIE_NAME, this.getCookieOptions())
  }

  private setCookie(res: Response, token: string): void {
    res.cookie(COOKIE_NAME, token, {
      ...this.getCookieOptions(),
      maxAge: SESSION_TTL_SECONDS * 1000,
    })
  }

  private getCookieOptions() {
    const isDev = this.configService.get<string>('APP_ENV') === 'development'
    return {
      httpOnly: true,
      secure: true,
      sameSite: (isDev ? 'none' : 'strict') as 'none' | 'strict',
      path: '/api/v1/iris-pay',
    }
  }
}
