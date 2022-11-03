import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CampaignService } from '../campaign/campaign.service'
import { HttpService } from '@nestjs/axios'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { DonationStatus, PaymentProvider } from '@prisma/client'

@Injectable()
export class PaypalService {
  constructor(
    private campaignService: CampaignService,
    private config: ConfigService,
    private httpService: HttpService,
  ) {}

  /*
   * Handle the create event
   */
  async createOrder(paypalOrder) {
    Logger.debug('Creating donation from paypal create order!', paypalOrder)

    //parse payment order
    const billingDetails = this.parsePaypalPaymentOrder(paypalOrder)

    Logger.debug('Parsed billing details: ', billingDetails)

    // get campaign by id
    const campaign = await this.campaignService.getCampaignById(billingDetails.campaignId)

    await this.campaignService.updateDonationPayment(
      campaign,
      billingDetails,
      DonationStatus.waiting,
    )

    Logger.debug('Donation created!')
  }

  /*
   * Handle the create event
   */
  async completePayment(paypalCaptureCompleted) {
    Logger.debug('Completing donation from paypal complete capture!', paypalCaptureCompleted)

    //parse payment order
    const billingDetails = this.parsePaypalCapture(paypalCaptureCompleted)

    Logger.debug('Parsed billing details: ', billingDetails)

    // get campaign by id
    const campaign = await this.campaignService.getCampaignById(billingDetails.campaignId)

    await this.campaignService.updateDonationPayment(
      campaign,
      billingDetails,
      DonationStatus.succeeded,
    )

    Logger.debug('Donation completed!')

    return paypalCaptureCompleted
  }

  /**
   * Verification of incoming webhook messages to avoid malicious sender.
   * https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature/
   * @param headers
   * @param rawPaypalBody - needs to be the raw post request body without default parsing to json
   * @returns boolean
   */
  async validatePaypalMessage(
    headers: Record<string, unknown>,
    rawPaypalBody: string,
  ): Promise<boolean> {
    const paypalVerificationUrl = new URL('/v1/notifications/verify-webhook-signature',
      this.config.get<string>('paypal.apiUrl')).toString()

    const token = await this.generateAccessToken()
    if (!token) return false

    enum verification_status {
      SUCCESS = 'SUCCESS',
      FAILURE = 'FAILURE',
    }

    //We need to create json as text to keep the format of the original paypal raw body
    let verifyRequest = '{'
    verifyRequest += '"auth_algo": "' + headers['paypal-auth-algo'] + '"'
    verifyRequest += ',"cert_url": "' + headers['paypal-cert-url'] + '"'
    verifyRequest += ',"transmission_id": "' + headers['paypal-transmission-id'] + '"'
    verifyRequest += ',"transmission_sig": "' + headers['paypal-transmission-sig'] + '"'
    verifyRequest += ',"transmission_time": "' + headers['paypal-transmission-time'] + '"'
    verifyRequest += ',"webhook_id": "' + this.config.get<string>('paypal.webhookId') + '"'
    verifyRequest += ',"webhook_event": ' + rawPaypalBody.toString()
    verifyRequest += '}'

    Logger.log('Verification request will be: ' + verifyRequest)

    const response = await this.httpService.axiosRef({
      url: paypalVerificationUrl,
      method: 'post',
      data: verifyRequest,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    Logger.log('verification response: ', response.data)
    Logger.log(`verification result: ${response.data.verification_status}`, 'PaypalWebhook')

    return response.data.verification_status === verification_status.SUCCESS
  }

  async generateAccessToken(): Promise<string | null> {
    Logger.log(
      `Generating token with clientId ${this.config.get<string>('paypal.clientId')}`,
      'PaypalWebhook',
    )

    const paypalTokenUrl = new URL('/v1/oauth2/token',
      this.config.get<string>('paypal.apiUrl')).toString()
    Logger.log(`Generating token with apiUrl ${paypalTokenUrl}`, 'PaypalWebhook')

    await this.httpService
      .axiosRef({
        url: paypalTokenUrl,
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en_US',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Access-Control-Allow-Origin': '*',
        },
        data: 'grant_type=client_credentials',
        auth: {
          username: this.config.get<string>('paypal.clientId') ?? '',
          password: this.config.get<string>('paypal.clientSecret') ?? '',
        },
      })
      .then((response) => {
        Logger.log(`Got token: ${response.data.access_token}`, 'PaypalWebhook')
        return response.data.access_token
      })
      .catch((e) => {
        Logger.error(`Couldn't get paypal token. Error is: ${e.message}`, 'PaypalWebhook')
        return null
      })

    return null
  }

  parsePaypalPaymentOrder(paypalOrder): PaymentData {
    //note we store the money in db as cents so we multiply incoming amounts by 100
    return {
      paymentProvider: PaymentProvider.paypal,
      campaignId: paypalOrder.resource.purchase_units[0].custom_id,
      paymentIntentId: paypalOrder.resource.purchase_units[0].payments.captures[0].id,
      netAmount:
        100 *
        Number(
          paypalOrder.resource.purchase_units[0].payments.captures[0].seller_receivable_breakdown
            .net_amount.value,
        ),
      chargedAmount:
        100 *
        Number(
          paypalOrder.resource.purchase_units[0].payments.captures[0].seller_receivable_breakdown
            .gross_amount.value,
        ),
      currency:
        paypalOrder.resource.purchase_units[0].payments.captures[0].seller_receivable_breakdown
          .gross_amount.currency_code,
      billingEmail: paypalOrder.resource.purchase_units[0].payee.email_address,
    }
  }

  parsePaypalCapture(paypalCapture): PaymentData {
    //note we store the money in db as cents so we multiply incoming amounts by 100
    Logger.debug('paypalCapture: ', paypalCapture.resource)

    return {
      paymentProvider: PaymentProvider.paypal,
      campaignId: paypalCapture.resource.custom_id,
      paymentIntentId: paypalCapture.resource.id,
      netAmount: 100 * Number(paypalCapture.resource.seller_receivable_breakdown.net_amount.value),
      chargedAmount:
        100 * Number(paypalCapture.resource.seller_receivable_breakdown.gross_amount.value),
      currency: paypalCapture.resource.seller_receivable_breakdown.gross_amount.currency_code,
    }
  }
}

type PaymentData = {
  campaignId: string
  paymentIntentId: string
  netAmount: number
  chargedAmount: number
  currency: string
  paymentProvider: PaymentProvider
  billingName?: string
  billingEmail?: string
  paymentMethodId?: string
  stripeCustomerId?: string
}
