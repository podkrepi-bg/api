import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import { IRISCreateCheckoutSessionDto } from './dto/create-iris-pay.dto'

import { IrisHookHash } from './entities/iris-pay.types'
import { IrisPayApiClient } from './iris-pay-api-client'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { IrisCreateCustomerDto } from './dto/create-iris-customer'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { FinishPaymentDto } from './dto/finish-payment.dto'
import { PaymentProvider, PaymentStatus, PaymentType, Prisma } from '@prisma/client'
import { PaymentData } from '../donations/helpers/payment-intent-helpers'
import { isFinal } from '../donations/helpers/donation-status-updates'

export interface FinalizeResult {
  status: PaymentStatus
  donationId?: string
  reason?: string
}

@Injectable()
export class IrisPayService {
  private readonly irisWebhookSecret: string
  constructor(
    private config: ConfigService,
    private irisApi: IrisPayApiClient,
    private prismaService: PrismaService,
    private campaignService: CampaignService,
    private donationsService: DonationsService,
  ) {
    this.irisWebhookSecret = this.config.get<string>('iris.irisWebhookSecret', '')
  }

  // Signs a paymentId so the value we hand to IRIS (and that IRIS echoes back
  // on its webhook) can be authenticated server-side. Format is
  // `<paymentId>.<hmac>` — paymentId stays readable, the HMAC proves the pair
  // was produced by us and wasn't tampered with in transit.
  signPaymentId(paymentId: string): string {
    const mac = this.toUrlSafe(
      createHmac('sha256', this.irisWebhookSecret).update(paymentId).digest('base64'),
    )
    return `${paymentId}.${mac}`
  }

  // Reverses `signPaymentId` and rejects any state the attacker didn't get
  // from us. Throws UnauthorizedException on malformed or mismatched input.
  verifySignedState(state: string): string {
    const dotIndex = state.indexOf('.')
    if (dotIndex === -1) {
      throw new UnauthorizedException('Invalid webhook state format')
    }
    const paymentId = state.slice(0, dotIndex)
    const mac = state.slice(dotIndex + 1)
    const expected = this.toUrlSafe(
      createHmac('sha256', this.irisWebhookSecret).update(paymentId).digest('base64'),
    )
    const macBuf = new Uint8Array(Buffer.from(mac))
    const expectedBuf = new Uint8Array(Buffer.from(expected))
    if (macBuf.length !== expectedBuf.length || !timingSafeEqual(macBuf, expectedBuf)) {
      throw new UnauthorizedException('Invalid webhook signature')
    }
    return paymentId
  }

  // Older @types/node don't expose 'base64url' on BinaryToTextEncoding, so
  // produce base64 then strip padding and swap the URL-unsafe characters —
  // equivalent output, same tamper resistance.
  private toUrlSafe(b64: string): string {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  // Rejects any redirect URL whose origin doesn't match APP_URL. IRIS forwards
  // the user here after payment, so an attacker-supplied host would be a free
  // phishing vector. Using origin (scheme + host + port) keeps dev-on-http
  // working when APP_URL itself is http://localhost:<port>, while prod stays
  // strict because APP_URL is https.
  private validateRedirectUrl(url: string | undefined, field: 'successUrl' | 'errorUrl'): void {
    if (url === undefined) return
    const appUrl = this.config.get<string>('APP_URL', '')
    let allowed: URL
    try {
      allowed = new URL(appUrl)
    } catch {
      Logger.error(`APP_URL is not a valid URL: ${appUrl}`)
      throw new InternalServerErrorException('Server misconfigured')
    }
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      throw new BadRequestException(`Invalid ${field}`)
    }
    if (parsed.protocol !== allowed.protocol || parsed.host !== allowed.host) {
      throw new BadRequestException(`${field} origin not allowed`)
    }
  }

  async createWebhook(
    paymentId: string,
    irisRegisterWebhookDto?: IRISCreateCheckoutSessionDto,
  ): Promise<string> {
    const APP_URL = this.config.get<string>('APP_URL')
    return this.irisApi.createHook({
      url: `${APP_URL}/api/v1/iris-pay/webhook`,
      // Signed so the webhook can authenticate IRIS's callback without trusting
      // the raw paymentId — anyone with the UUID alone can't forge this.
      state: this.signPaymentId(paymentId),
    })
  }

  async verifyPayment(body: { hookHash: string }): Promise<IrisHookHash> {
    return this.irisApi.getPaymentStatus(body.hookHash)
  }

  async createCustomer(irisCreateCustomerDto: IrisCreateCustomerDto): Promise<string> {
    try {
      const found = await this.irisApi.findCustomer(irisCreateCustomerDto.email)
      if (found?.userHash) {
        Logger.debug('IRIS customer found by email')
        return found.userHash
      }
    } catch (err) {
      if (!this.isEmailNotFoundError(err)) {
        throw err
      }
      // emailNotFound — fall through to signup.
    }

    const APP_URL = this.config.get('APP_URL', '')
    Logger.debug('IRIS Customer not found. Creating new one')
    const created = await this.irisApi.signupCustomer({
      ...irisCreateCustomerDto,
      webhookUrl: `${APP_URL}/api/v1/iris-pay/webhook/customer`,
      identityHash: `${randomUUID()}`,
    })
    if (!created?.userHash) {
      throw new InternalServerErrorException('IRIS signup did not return a userHash')
    }
    return created.userHash
  }

  // IRIS reports an unknown email as HTTP 400 with body `{code: "emailNotFound"}`.
  // Treated as a soft "not found" so `createCustomer` can fall through to signup;
  // any other failure is a hard error and propagates.
  private isEmailNotFoundError(err: unknown): boolean {
    return (
      axios.isAxiosError(err) &&
      err.response?.status === 400 &&
      (err.response.data as { code?: string } | undefined)?.code === 'emailNotFound'
    )
  }

  async createCheckout(irisCreateCheckoutDto: IRISCreateCheckoutSessionDto) {
    // Reject off-host redirect URLs before we hand them to IRIS. IRIS forwards
    // the user there after payment, so an attacker-supplied host turns this
    // into a free phishing redirect.
    this.validateRedirectUrl(irisCreateCheckoutDto.successUrl, 'successUrl')
    this.validateRedirectUrl(irisCreateCheckoutDto.errorUrl, 'errorUrl')

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

    console.log(userHashRes, webhookRes as any)

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

    const donation = payment.donations[0]

    // Idempotency: once the payment is in a final state (see the repo's
    // central status policy in `donation-status-updates.ts`), re-polling IRIS
    // and re-writing would repeat work — `shouldAllowStatusChange` inside
    // `updateDonationPayment` would reject the write anyway. Short-circuit
    // before the external call so webhook replays and duplicate /finalize
    // calls are cheap.
    if (isFinal(payment.status)) {
      return {
        status: payment.status,
        donationId: donation.id,
        reason: this.extractIrisReasonForFail(donation.metadata),
      }
    }

    const hookHash = payment.extPaymentIntentId
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

    const updated = await this.donationsService.updateDonationPayment(campaign, paymentData, status)

    await this.storeIrisMetadata(donation.id, irisResult)

    return {
      status,
      donationId: updated?.id,
      reason: irisResult.reasonForFail,
    }
  }

  // Reads the most recent `reasonForFail` we persisted for this donation.
  // Used on the final-state idempotency short-circuit so the client gets
  // the same `reason` it would have received from a full finalize call.
  private extractIrisReasonForFail(
    metadata: { extraData: Prisma.JsonValue } | null,
  ): string | undefined {
    const extra = metadata?.extraData as { iris?: { reasonForFail?: string } } | null | undefined
    return extra?.iris?.reasonForFail
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
    const updated = await this.donationsService.updateDonationPayment(
      campaign,
      paymentData,
      paymentStatus,
    )
    return updated?.id
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
