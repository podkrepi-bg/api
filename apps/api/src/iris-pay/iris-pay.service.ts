import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { IRISCreateCheckoutSessionDto } from './dto/create-iris-pay.dto'

import {
  CreateCustomerReq,
  CreateIrisCustomerResponse,
  RegisterWebhookReq,
} from './entities/iris-pay.types'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { IrisCreateCustomerDto } from './dto/create-iris-customer'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { FinishPaymentDto } from './dto/finish-payment.dto'
import { PaymentProvider, PaymentStatus, DonationType } from '@prisma/client'
import { PaymentData } from '../donations/helpers/payment-intent-helpers'

export interface IrisHookHash {
  date: Date
  payeeName: string
  payerName: string
  payerBank: PayeBank
  payeeBank: PayeBank
  description: string
  sum: string
  payerIban: string
  payeeIban: string
  id: string
  currency: string
  status: string
  reasonForFail: string
}

export interface PayeBank {
  bankHash: string
  name: string
  country: string
}

@Injectable()
export class IrisPayService {
  agentHash: string
  irisEndpoint: string
  constructor(
    private config: ConfigService,
    private httpService: HttpService,
    private prismaService: PrismaService,
    private campaignService: CampaignService,
    private donationsService: DonationsService,
  ) {
    this.agentHash = this.config.get<string>('IRIS_AGENT_HASH', '')
    this.irisEndpoint = this.config.get<string>('IRIS_API_URL', '')
  }

  async createWebhook(irisRegisterWebhookDto?: IRISCreateCheckoutSessionDto) {
    const APP_URL = this.config.get<string>('APP_URL')
    const data: RegisterWebhookReq = {
      url: `${APP_URL}/iris-pay/webhook`,
      agentHash: this.agentHash,
      successUrl: irisRegisterWebhookDto?.successUrl,
      errorUrl: irisRegisterWebhookDto?.errorUrl,
    }

    const webhookUrl = `${this.irisEndpoint}/createhook`
    return (await this.httpService.axiosRef.post<string>(webhookUrl, data)).data
  }

  async verifyPayment(body: { hookHash: string }) {
    const result = await this.httpService.axiosRef.get<IrisHookHash>(
      `${this.irisEndpoint}/status/${body.hookHash}`,
      {
        headers: {
          'x-agent-hash': this.agentHash,
        },
      },
    )

    return result?.data
  }

  async createCustomer(irisCreateCustomerDto: IrisCreateCustomerDto) {
    const irisCustomer = await this.prismaService.irisCustomer.findFirst({
      where: { email: irisCreateCustomerDto.email },
    })
    if (irisCustomer) {
      Logger.debug('Customer with email found')
      return irisCustomer.userHash
    }
    const data: CreateCustomerReq = {
      agentHash: this.agentHash,
      ...irisCreateCustomerDto,
    }

    Logger.debug('IRIS Customer not found. Creating new one')
    const createCustomerUrl = `${this.irisEndpoint}/signup`
    const irisCreateCustomer = await this.httpService.axiosRef.post<CreateIrisCustomerResponse>(
      createCustomerUrl,
      data,
    )
    if (irisCreateCustomer?.data?.userHash) {
      await this.prismaService.irisCustomer.create({
        data: { email: irisCreateCustomerDto.email, userHash: irisCreateCustomer.data.userHash },
      })
    }
    return irisCreateCustomer.data.userHash
  }

  async createCheckout(irisCreateCheckoutDto: IRISCreateCheckoutSessionDto) {
    const campaign = await this.campaignService.getCampaignById(irisCreateCheckoutDto.campaignId)
    await this.campaignService.validateCampaign(campaign)
    const userObj: IrisCreateCustomerDto = {
      email: irisCreateCheckoutDto.email,
      name: irisCreateCheckoutDto.name,
      family: irisCreateCheckoutDto.family,
    }
    const userHashRes = this.createCustomer(userObj)
    const webhookRes = this.createWebhook(irisCreateCheckoutDto)
    const [userHash, webhook] = await Promise.allSettled([userHashRes, webhookRes])
    if (userHash.status !== 'fulfilled' || webhook.status !== 'fulfilled') {
      throw new InternalServerErrorException(
        "Couldn't initiate IRIS checkout at this time.\n Please try again later",
      )
    }

    return {
      hookHash: webhook.value,
      userHash: userHash.value,
    }
  }

  async finishPaymentSession(finishPaymentDto: FinishPaymentDto): Promise<string | undefined> {
    Logger.debug('Finishing payment session', {
      hookHash: finishPaymentDto.hookHash,
      status: finishPaymentDto.status,
      campaignId: finishPaymentDto.metadata.campaignId,
    })

    // Get the campaign
    const campaign = await this.campaignService.getCampaignById(
      finishPaymentDto.metadata.campaignId,
    )
    if (!campaign) {
      throw new Error(`Campaign not found: ${finishPaymentDto.metadata.campaignId}`)
    }

    // Transform the finish payment DTO to PaymentData structure
    const paymentData: PaymentData = {
      paymentIntentId: finishPaymentDto.hookHash,
      netAmount: finishPaymentDto.amount,
      chargedAmount: finishPaymentDto.amount,
      currency: campaign.currency.toLowerCase(),
      paymentProvider: PaymentProvider.irispay,
      billingName: finishPaymentDto.billingName,
      billingEmail: finishPaymentDto.billingEmail,
      personId:
        finishPaymentDto.metadata.isAnonymous === 'false' && finishPaymentDto.metadata.personId
          ? finishPaymentDto.metadata.personId
          : undefined,
      type: finishPaymentDto.metadata.type,
    }

    // Map status string to PaymentStatus enum
    const paymentStatus = this.mapStatusToPaymentStatus(finishPaymentDto.status)

    // Call donationService.updateDonationPayment
    return await this.donationsService.updateDonationPayment(campaign, paymentData, paymentStatus)
  }

  mapStatusToPaymentStatus(status: string): PaymentStatus {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return PaymentStatus.succeeded
      case 'FAILED':
        return PaymentStatus.declined
      case 'WAITING':
        return PaymentStatus.waiting
      default:
        Logger.warn(`Unknown payment status: ${status}, defaulting to waiting`)
        return PaymentStatus.waiting
    }
  }

  remove(id: number) {
    return `This action removes a #${id} irisPay`
  }
}
