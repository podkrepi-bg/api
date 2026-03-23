import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Request, Response } from 'express'

export interface PaymentSessionPayload {
  step: 'initialSession' | 'paymentSessionCreated'
  hookHash?: string
  userHash?: string
}

const COOKIE_NAME = 'payment_jwt'
const SESSION_TTL_SECONDS = 5 * 60 // 5 minutes

@Injectable()
export class PaymentSessionService {
  private readonly secret: string

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.secret = this.configService.get<string>('iris.paymentSessionSecret', '')
  }

  createInitialSession(res: Response): void {
    const payload: PaymentSessionPayload = { step: 'initialSession' }
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

  upgradeSession(res: Response, data: { hookHash: string; userHash: string }): void {
    const payload: PaymentSessionPayload = {
      step: 'paymentSessionCreated',
      hookHash: data.hookHash,
      userHash: data.userHash,
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
    const isProduction = this.configService.get<string>('APP_ENV') !== 'development'
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/api/v1/iris-pay',
    }
  }
}
