import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'

import { PaymentSessionService } from '../services/payment-session.service'
import { PAYMENT_STEP_KEY } from '../decorators/payment-step.decorator'

@Injectable()
export class PaymentSessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly paymentSessionService: PaymentSessionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedStep = this.reflector.get<string>(PAYMENT_STEP_KEY, context.getHandler())
    if (!expectedStep) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const payload = this.paymentSessionService.validateSession(request, expectedStep)

    // Attach the validated payload to the request for controller access
    ;(request as any).paymentSession = payload

    return true
  }
}
