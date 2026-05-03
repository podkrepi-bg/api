import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  Query,
  Header,
  Headers,
  HttpCode,
  UseGuards,
  Logger,
  NotFoundException,
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { IrisPayService } from './iris-pay.service'
import { IRISCreateCheckoutSessionDto } from './dto/create-iris-pay.dto'
import { Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import {
  RealmBetaTester,
  RealmViewSupporters,
  ViewSupporters,
} from '@podkrepi-bg/podkrepi-types'
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
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role, RealmBetaTester.role],
    mode: RoleMatchingMode.ANY,
  })
  async startSession(@Res({ passthrough: true }) res: Response) {
    this.paymentSessionService.createInitialSession(res)
    return { status: 'ok' }
  }

  @Post('create-payment-session')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role, RealmBetaTester.role],
    mode: RoleMatchingMode.ANY,
  })
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
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role, RealmBetaTester.role],
    mode: RoleMatchingMode.ANY,
  })
  @UseGuards(PaymentSessionGuard)
  @PaymentStep('paymentSessionCreated')
  async finalize(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<
    { status: string; donationId?: string; reason?: string } | { error: string; reason?: string }
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

  @Get('webhook')
  @Public()
  @Header('Cache-Control', 'no-store')
  async webhookEndpoint(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    Logger.debug(
      `Iris webhook received:\n${JSON.stringify(
        {
          method: req.method,
          url: req.originalUrl,
          eventType: headers['x-iris-event-type'],
          query,
          headers,
          body: req.body,
        },
        null,
        2,
      )}`,
    )

    const state = query.state
    if (!state) {
      return { ok: true }
    }
    let paymentId: string
    try {
      paymentId = this.irisPayService.verifySignedState(state)
    } catch (error) {
      // Always 200 so IRIS doesn't retry, but log distinctly so legitimate
      // failures are separable from forged/replayed probes.
      if (error instanceof UnauthorizedException) {
        Logger.warn('Iris webhook rejected: invalid signature')
      } else {
        Logger.warn(`Iris webhook rejected: ${error}`)
      }
      return { ok: true }
    }
    try {
      await this.irisPayService.finalizePayment(paymentId)
    } catch (error) {
      Logger.warn(`Iris webhook finalize failed for paymentId=${paymentId}: ${error}`)
    }
    return { ok: true }
  }

  @Get('webhook/customer')
  @Public()
  async customerWebhookGet(@Req() req: any) {
    Logger.log('Customer endpoint called POST')
    console.log(req)

    return { ok: true }
  }

  @Post('webhook/customer')
  @Public()
  async customerWebhook(@Req() req: any) {
    Logger.log('Customer endpoint called POST')
    console.log(req)

    return { ok: true }
  }
}
