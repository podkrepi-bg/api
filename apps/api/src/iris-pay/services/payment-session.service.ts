import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { randomUUID } from 'crypto'
import { Request, Response } from 'express'

export interface PaymentSessionPayload {
  step: 'initialSession' | 'paymentSessionCreated'
  jti?: string
  paymentId?: string
}

const COOKIE_NAME = 'payment_jwt'
const SESSION_TTL_SECONDS = 5 * 60 // 5 minutes

@Injectable()
export class PaymentSessionService {
  private readonly secret: string

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

  // Best-effort single-use guard for the JWT's jti. Guarantees are limited:
  //
  //   - Within a single process, sequential duplicates are rejected (second
  //     call sees the cache entry from the first).
  //   - Two *simultaneous* requests in the same process can both pass the
  //     get-before-set window and double-submit; the damage is bounded to a
  //     pair of orphan payment rows (no money, no auth impact).
  //   - Across processes (multi-pod deploys), the in-memory cache is not
  //     shared, so this guard provides no dedup at all.
  //
  // We accept this today because the public endpoint's worst-case outcome is
  // a duplicate `payment` row that never gets completed — no privilege
  // escalation, no value extracted, the attacker gains nothing for the cost
  // of one real IRIS payment.
  //
  // TODO(cross-pod dedup): when the API is horizontally scaled, migrate this
  // to a shared store (Redis SETNX, or a Postgres one-time-token table with
  // `INSERT … ON CONFLICT DO NOTHING`) so the guard survives across replicas.
  async consumeSession(payload: PaymentSessionPayload): Promise<void> {
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid payment session: missing jti')
    }

    const cacheKey = `iris-pay:jti:${payload.jti}`
    const consumed = await this.cacheManager.get(cacheKey)
    if (consumed) {
      throw new UnauthorizedException('Payment session already used')
    }

    await this.cacheManager.set(cacheKey, true, SESSION_TTL_SECONDS * 1000)
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
