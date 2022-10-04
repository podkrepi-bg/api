import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { CampaignService } from '../../campaign/campaign.service'
import { StripePaymentService } from './stripe-payment.service'
import { getPaymentData } from '../helpers/payment-intent-helpers'
import Stripe from 'stripe'
import { VaultService } from '../../vault/vault.service'
import { PersonService } from '../../person/person.service'
import { MockPrismaService } from '../../prisma/prisma-client.mock'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { StripeModule, StripeModuleConfig, StripePayloadService } from '@golevelup/nestjs-stripe'

import {
  campaignId,
  mockedCampaign,
  mockPaymentEventCancelled,
  mockPaymentEventCreated,
  mockPaymentEventSucceeded,
  mockPaymentIntentCreated,
  mockPaymentIntentBGIncluded,
  mockPaymentIntentBGIncludedNot,
  mockPaymentIntentUSIncluded,
  mockPaymentIntentUKIncluded,
} from './stripe-payment.testdata'
import { DonationStatus } from '@prisma/client'

const defaultStripeWebhookEndpoint = '/stripe/webhook'
const stripeSecret = 'wh_123'

describe('StripePaymentService', () => {
  let stripePaymentService: StripePaymentService
  let app: INestApplication
  let hydratePayloadFn: jest.SpyInstance
  const stripe = new Stripe(stripeSecret, { apiVersion: '2020-08-27' })

  const moduleConfig: StripeModuleConfig = {
    apiKey: stripeSecret,
    webhookConfig: {
      stripeWebhookSecret: stripeSecret,
      loggingConfiguration: {
        logMatchingEventHandlers: true,
      },
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        StripeModule.forRootAsync(StripeModule, {
          useFactory: () => moduleConfig,
        }),
      ],
      providers: [
        ConfigService,
        StripePaymentService,
        CampaignService,
        MockPrismaService,
        VaultService,
        PersonService,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()

    stripePaymentService = app.get<StripePaymentService>(StripePaymentService)

    //this intercepts the request raw body and removes the exact signature check
    const stripePayloadService = app.get<StripePayloadService>(StripePayloadService)

    jest
      .spyOn(stripePayloadService, 'tryHydratePayload')
      .mockImplementation((_sig, buff) => buff as any)
  })

  afterEach(() => jest.resetAllMocks())

  it('should be defined', () => {
    expect(stripePaymentService).toBeDefined()
  })

  it('should handle payment_intent.created', () => {
    const payloadString = JSON.stringify(mockPaymentEventCreated, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    const paymentData = getPaymentData(mockPaymentEventCreated.data.object as Stripe.PaymentIntent)

    const mockedupdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockImplementation(() => Promise.resolve())
      .mockName('updateDonationPayment')

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(campaignId) //campaignId from the Stripe Event
        expect(mockedupdateDonationPayment).toHaveBeenCalledWith(
          mockedCampaign,
          paymentData,
          DonationStatus.waiting,
        )
      })
  })

  it('should handle payment_intent.canceled', () => {
    const payloadString = JSON.stringify(mockPaymentEventCancelled, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    const paymentData = getPaymentData(
      mockPaymentEventCancelled.data.object as Stripe.PaymentIntent,
    )

    const mockedupdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockImplementation(() => Promise.resolve())
      .mockName('updateDonationPayment')

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(campaignId) //campaignId from the Stripe Event
        expect(mockedupdateDonationPayment).toHaveBeenCalledWith(
          mockedCampaign,
          paymentData,
          DonationStatus.cancelled,
        )
      })
  })

  it('should handle payment_intent.succeeded', () => {
    const payloadString = JSON.stringify(mockPaymentEventSucceeded, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    const paymentData = getPaymentData(
      mockPaymentEventSucceeded.data.object as Stripe.PaymentIntent,
    )

    const mockedupdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockImplementation(() => Promise.resolve())
      .mockName('updateDonationPayment')

    const mockedDonateToCampaign = jest
      .spyOn(campaignService, 'donateToCampaign')
      .mockName('donateToCampaign')

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(campaignId) //campaignId from the Stripe Event
        expect(mockedDonateToCampaign).toHaveBeenCalledWith(mockedCampaign, paymentData)
        expect(mockedupdateDonationPayment).toHaveBeenCalledWith(
          mockedCampaign,
          paymentData,
          DonationStatus.succeeded,
        )
      })
  })

  it('calculate payment-intent.created', async () => {
    const billingDetails = getPaymentData(mockPaymentIntentCreated)
    expect(billingDetails.netAmount).toEqual(0)
    expect(billingDetails.chargedAmount).toEqual(1065)
  })

  it('calculate payment-intent.succeeded with BG tax included in charge', async () => {
    const billingDetails = getPaymentData(mockPaymentIntentBGIncluded)
    expect(billingDetails.netAmount).toEqual(1000)
    expect(billingDetails.chargedAmount).toEqual(1063)
  })
})

it('calculate payment-intent.succeeded with BG tax not included in charge', async () => {
  const billingDetails = getPaymentData(mockPaymentIntentBGIncludedNot)
  expect(billingDetails.netAmount).toEqual(938)
  expect(billingDetails.chargedAmount).toEqual(1000)
})

it('calculate payment-intent.succeeded with US tax included in charge', async () => {
  const billingDetails = getPaymentData(mockPaymentIntentUSIncluded)
  expect(billingDetails.netAmount).toEqual(10000)
  expect(billingDetails.chargedAmount).toEqual(10350)
})

it('calculate payment-intent.succeeded with GB tax included in charge', async () => {
  const billingDetails = getPaymentData(mockPaymentIntentUKIncluded)
  expect(billingDetails.netAmount).toEqual(50000)
  expect(billingDetails.chargedAmount).toEqual(51333)
})
