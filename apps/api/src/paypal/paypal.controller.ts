import { Controller, Logger, Post, Req, RawBodyRequest, BadRequestException } from '@nestjs/common'
import { Request } from 'express'
import { Public } from 'nest-keycloak-connect'
import { PaypalService } from './paypal.service'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('paypal')
@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('webhook')
  @Public()
  async completeCapture(@Req() req: RawBodyRequest<Request>) {
    Logger.log('Paypal new capture received with signiture: ' + req.headers, 'Paypal')
    Logger.log('paypal request body is buffer: ' + Buffer.isBuffer(req.body), 'Paypal')
    Logger.log('Paypal new capture received with rawBody: ' + req.body.toString(), 'Paypal')

    if (!(await this.paypalService.validatePaypalMessage(req.headers, req.body.toString())))
      throw new BadRequestException('Paypal verification: invalid webhook request')

    const parsedBody = JSON.parse(req.body)

    if (parsedBody.event_type === 'CHECKOUT.ORDER.APPROVED')
      this.paypalService.createOrder(parsedBody)
    if (parsedBody.event_type === 'PAYMENT.CAPTURE.COMPLETED')
      this.paypalService.completePayment(parsedBody)
  }
}
