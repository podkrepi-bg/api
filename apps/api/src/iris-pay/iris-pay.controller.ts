import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  Query,
  HttpCode,
  UseGuards,
  Logger,
  NotFoundException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { IrisPayService } from './iris-pay.service'
import { IRISCreateCheckoutSessionDto } from './dto/create-iris-pay.dto'
import { CompletePaymentDto } from './dto/complete-payment.dto'
import { Public } from 'nest-keycloak-connect'
import { PaymentSessionGuard } from './guards/payment-session.guard'
import { PaymentStep } from './decorators/payment-step.decorator'
import { PaymentSessionService } from './services/payment-session.service'

import { ApiTags } from '@nestjs/swagger'

@Controller('iris-pay')
@ApiTags()
export class IrisPayController {
  constructor(
    private readonly irisPayService: IrisPayService,
    private readonly paymentSessionService: PaymentSessionService,
  ) {}

  @Post('start-session')
  @Public()
  async startSession(@Res({ passthrough: true }) res: Response) {
    this.paymentSessionService.createInitialSession(res)
    return { status: 'ok' }
  }

  @Post('create-payment-session')
  @Public()
  @UseGuards(PaymentSessionGuard)
  @PaymentStep('initialSession')
  async createIRISCheckoutSession(
    @Body() irisCreateCustomerDto: IRISCreateCheckoutSessionDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ paymentId: string; hookHash: string; userHash: string }> {
    await this.paymentSessionService.consumeSession((req as any).paymentSession)
    const result = await this.irisPayService.createCheckout(irisCreateCustomerDto)
    this.paymentSessionService.upgradeSession(res, { paymentId: result.paymentId })
    return result
  }

  @Post('finalize')
  @HttpCode(200)
  @Public()
  @UseGuards(PaymentSessionGuard)
  @PaymentStep('paymentSessionCreated')
  async finalize(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<
    | { status: string; donationId?: string; reason?: string }
    | { error: string; reason?: string }
  > {
    const session = (req as any).paymentSession
    const paymentId: string | undefined = session?.paymentId
    if (!paymentId) {
      this.paymentSessionService.clearSession(res)
      throw new NotFoundException({ error: 'unknown_payment' })
    }

    Logger.debug('Finalizing IRIS payment', { paymentId })

    try {
      const result = await this.irisPayService.finalizePayment(paymentId)
      this.paymentSessionService.clearSession(res)
      return {
        status: result.status,
        donationId: result.donationId,
        reason: result.reason,
      }
    } catch (err) {
      if (err instanceof ServiceUnavailableException) {
        // Keep session — FE falls back to pending, webhook reconciles.
        throw err
      }
      this.paymentSessionService.clearSession(res)
      if (err instanceof NotFoundException || err instanceof ConflictException) {
        throw err
      }
      Logger.error(`Unexpected /finalize error for paymentId=${paymentId}: ${err}`)
      throw err
    }
  }

  @Post('complete')
  @HttpCode(200)
  @Public()
  async completePayment(
    @Body() completePaymentDto: CompletePaymentDto,
  ): Promise<{ status: string }> {
    // Deprecated: superseded by /finalize. Kept as a no-op so older
    // deployed frontends don't break during rollout. Remove in a follow-up PR.
    Logger.warn('Deprecated /iris-pay/complete endpoint called', {
      hookHash: (completePaymentDto as unknown as { hookHash?: string })?.hookHash,
    })
    return { status: 'deprecated' }
  }

  @Get('webhook')
  @Public()
  async webhookEndpoint(@Query('state') state: string) {
    Logger.debug('Iris webhook received', { state })
    if (!state) {
      return { ok: true }
    }
    try {
      await this.irisPayService.finalizePayment(state)
    } catch (error) {
      Logger.warn(`Iris webhook finalize failed for state=${state}: ${error}`)
    }
    return { ok: true }
  }
}
