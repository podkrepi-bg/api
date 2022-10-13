import { Controller, Logger, Post, Req, RawBodyRequest, BadRequestException } from '@nestjs/common'
import { Request } from 'express'
import { Public } from 'nest-keycloak-connect'
import { PaypalService } from './paypal.service'

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('webhook')
  @Public()
  async completeCapture(@Req() req: RawBodyRequest<Request>) {
    Logger.debug('Paypal new capture received with signiture: ', req.headers)
    Logger.debug('Paypal new capture received with rawBody: ', req.body)

    if (!(await this.paypalService.validatePaypalMessage(req.headers, req.body)))
      throw new BadRequestException('Paypal verification: invalid webhook request')

    const parsedBody = JSON.parse(req.body)

    if (parsedBody.event_type === 'CHECKOUT.ORDER.APPROVED')
      this.paypalService.createOrder(parsedBody)
    if (parsedBody.event_type === 'PAYMENT.CAPTURE.COMPLETED')
      this.paypalService.completePayment(parsedBody)
  }
}
