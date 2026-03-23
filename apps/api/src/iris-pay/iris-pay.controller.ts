import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  RawBodyRequest,
  Query,
  HttpCode,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { IrisPayService } from './iris-pay.service'
import { IRISCreateCheckoutSessionDto } from './dto/create-iris-pay.dto'
import { CompletePaymentDto } from './dto/complete-payment.dto'
import { FinishPaymentDto } from './dto/finish-payment.dto'
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
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ hookHash: string; userHash: string }> {
    const result = await this.irisPayService.createCheckout(irisCreateCustomerDto)
    this.paymentSessionService.upgradeSession(res, {
      hookHash: result.hookHash,
      userHash: result.userHash,
    })
    return result
  }

  @Post('complete')
  @HttpCode(200)
  @Public()
  @UseGuards(PaymentSessionGuard)
  @PaymentStep('paymentSessionCreated')
  async completePayment(
    @Body() completePaymentDto: CompletePaymentDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ donationId?: string; status: string }> {
    // Extract hookHash from the validated JWT session (tamper-proof)
    const session = (req as any).paymentSession
    const hookHash: string = session.hookHash

    Logger.debug('Completing payment from session', { hookHash })

    // Verify payment status with Iris API
    const verifyResult = await this.irisPayService.verifyPayment({ hookHash })

    // Build the finish DTO using hookHash from JWT and remaining data from request body
    const finishDto: FinishPaymentDto = Object.assign(new FinishPaymentDto(), {
      hookHash,
      status: verifyResult?.status || completePaymentDto.status,
      amount: completePaymentDto.amount,
      billingName: completePaymentDto.billingName,
      billingEmail: completePaymentDto.billingEmail,
      metadata: completePaymentDto.metadata,
    })

    const donationId = await this.irisPayService.finishPaymentSession(finishDto)

    // Clear the session cookie -- payment is complete
    this.paymentSessionService.clearSession(res)

    // Map Iris status (CONFIRMED/FAILED/WAITING) to unified PaymentStatus (succeeded/declined/waiting)
    const irisStatus = verifyResult?.status || completePaymentDto.status
    const unifiedStatus = this.irisPayService.mapStatusToPaymentStatus(irisStatus)

    return { donationId, status: unifiedStatus }
  }

  @Get('webhook')
  @Public()
  async webhookEndpoint(@Req() req: RawBodyRequest<Request>, @Query('state') state: string) {
    console.log(`Webhook ${state} executed`)
  }
}
