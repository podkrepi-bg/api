import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { randomUUID } from 'crypto'
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
import { PaymentProvider, PaymentStatus, PaymentType, Prisma } from '@prisma/client'
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

export interface FinalizeResult {
  status: PaymentStatus
  donationId?: string
  reason?: string
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

  async createWebhook(
    paymentId: string,
    irisRegisterWebhookDto?: IRISCreateCheckoutSessionDto,
  ): Promise<string> {
    const APP_URL = this.config.get<string>('APP_URL')
    const data: RegisterWebhookReq = {
      url: `${APP_URL}/api/v1/iris-pay/webhook`,
      agentHash: this.agentHash,
      state: paymentId,
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

    const paymentId = randomUUID()

    const userObj: IrisCreateCustomerDto = {
      email: irisCreateCheckoutDto.email,
      name: irisCreateCheckoutDto.name,
      family: irisCreateCheckoutDto.family,
    }
    const [userHashRes, webhookRes] = await Promise.allSettled([
      this.createCustomer(userObj),
      this.createWebhook(paymentId, irisCreateCheckoutDto),
    ])

    if (userHashRes.status !== 'fulfilled' || webhookRes.status !== 'fulfilled') {
      throw new InternalServerErrorException(
        "Couldn't initiate IRIS checkout at this time.\n Please try again later",
      )
    }
    const userHash = userHashRes.value
    const hookHash = webhookRes.value

    await this.prismaService.$transaction(async (tx) => {
      const vault = await tx.vault.findFirstOrThrow({ where: { campaignId: campaign.id } })

      await tx.payment.create({
        data: {
          id: paymentId,
          extPaymentIntentId: hookHash,
          extCustomerId: userHash,
          extPaymentMethodId: '',
          provider: PaymentProvider.irispay,
          type: PaymentType.single,
          status: PaymentStatus.initial,
          currency: campaign.currency,
          amount: irisCreateCheckoutDto.amount,
          chargedAmount: irisCreateCheckoutDto.amount,
          billingName: irisCreateCheckoutDto.billingName,
          billingEmail: irisCreateCheckoutDto.billingEmail,
          donations: {
            create: {
              amount: irisCreateCheckoutDto.amount,
              type: irisCreateCheckoutDto.type,
              targetVault: { connect: { id: vault.id } },
              person:
                irisCreateCheckoutDto.isAnonymous || !irisCreateCheckoutDto.personId
                  ? {}
                  : { connect: { id: irisCreateCheckoutDto.personId } },
            },
          },
        },
      })
    })

    return {
      paymentId,
      hookHash,
      userHash,
    }
  }

  async finalizePayment(paymentId: string): Promise<FinalizeResult> {
    const payment = await this.prismaService.payment.findUnique({
      where: { id: paymentId },
      include: {
        donations: {
          include: {
            targetVault: { include: { campaign: true } },
            metadata: true,
          },
        },
      },
    })

    if (!payment || payment.donations.length === 0) {
      throw new NotFoundException('unknown_payment')
    }

    const hookHash = payment.extPaymentIntentId
    const donation = payment.donations[0]
    const campaign = donation.targetVault.campaign

    let irisResult: IrisHookHash
    try {
      irisResult = await this.verifyPayment({ hookHash })
    } catch (error) {
      Logger.warn(`IRIS verifyPayment failed for paymentId=${paymentId}: ${error}`)
      throw new ServiceUnavailableException('iris_unavailable')
    }

    if (!irisResult) {
      throw new ServiceUnavailableException('iris_unavailable')
    }

    if (
      irisResult.currency &&
      campaign.currency &&
      irisResult.currency.toLowerCase() !== campaign.currency.toLowerCase()
    ) {
      Logger.error(
        `IRIS/campaign currency mismatch: iris=${irisResult.currency} campaign=${campaign.currency} paymentId=${paymentId}`,
      )
      throw new ConflictException('currency_mismatch')
    }

    const irisAmount = this.parseIrisSum(irisResult.sum)
    if (irisAmount !== payment.amount) {
      Logger.warn(
        `IRIS/DB amount mismatch: iris=${irisAmount} db=${payment.amount} paymentId=${paymentId}. Using IRIS amount.`,
      )
    }

    const status = this.mapStatusToPaymentStatus(irisResult.status)

    const paymentData: PaymentData = {
      paymentIntentId: hookHash,
      netAmount: irisAmount,
      chargedAmount: irisAmount,
      currency: campaign.currency.toLowerCase(),
      paymentProvider: PaymentProvider.irispay,
      billingName: payment.billingName ?? undefined,
      billingEmail: payment.billingEmail ?? undefined,
      personId: donation.personId ?? undefined,
      type: donation.type,
    }

    const donationId = await this.donationsService.updateDonationPayment(
      campaign,
      paymentData,
      status,
    )

    await this.storeIrisMetadata(donation.id, irisResult)

    return {
      status,
      donationId,
      reason: irisResult.reasonForFail,
    }
  }

  private async storeIrisMetadata(donationId: string, irisResult: IrisHookHash): Promise<void> {
    const irisExtra = {
      iris: {
        payerName: irisResult.payerName,
        payerIban: irisResult.payerIban,
        payerBank: irisResult.payerBank,
        payeeName: irisResult.payeeName,
        payeeIban: irisResult.payeeIban,
        payeeBank: irisResult.payeeBank,
        reasonForFail: irisResult.reasonForFail,
        irisTransactionId: irisResult.id,
        verifiedAt: new Date().toISOString(),
      },
    }

    try {
      await this.prismaService.donationMetadata.upsert({
        where: { donationId },
        update: { extraData: irisExtra as unknown as Prisma.InputJsonValue },
        create: {
          donationId,
          extraData: irisExtra as unknown as Prisma.InputJsonValue,
        },
      })
    } catch (error) {
      Logger.warn(`Failed to persist IRIS metadata for donation=${donationId}: ${error}`)
    }
  }

  parseIrisSum(sum: string): number {
    if (sum === undefined || sum === null) {
      throw new Error(`Invalid IRIS sum: ${sum}`)
    }
    const normalized = String(sum).trim().replace(',', '.')
    if (normalized === '' || !/^\d+(\.\d+)?$/.test(normalized)) {
      throw new Error(`Invalid IRIS sum: "${sum}"`)
    }
    const asFloat = parseFloat(normalized)
    if (Number.isNaN(asFloat) || asFloat < 0) {
      throw new Error(`Invalid IRIS sum: "${sum}"`)
    }
    return Math.round(asFloat * 100)
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
