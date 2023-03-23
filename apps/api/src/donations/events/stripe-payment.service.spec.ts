import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { CampaignService } from '../../campaign/campaign.service'
import { StripePaymentService } from './stripe-payment.service'
import { getPaymentDataFromCharge } from '../helpers/payment-intent-helpers'
import Stripe from 'stripe'
import { VaultService } from '../../vault/vault.service'
import { PersonService } from '../../person/person.service'
import { MockPrismaService, prismaMock } from '../../prisma/prisma-client.mock'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { StripeModule, StripeModuleConfig, StripePayloadService } from '@golevelup/nestjs-stripe'

import { DonationType, RecurringDonationStatus } from '@prisma/client'

import {
  campaignId,
  mockedCampaign,
  mockPaymentIntentBGIncludedNot,
  mockPaymentIntentUSIncluded,
  mockPaymentIntentUKIncluded,
  mockCustomerSubscriptionCreated,
  mockedRecurringDonation,
  mockInvoicePaidEvent,
  mockedCampaignCompeleted,
  mockedVault,
  mockChargeEventSucceeded,
  mockPaymentIntentBGIncluded,
} from './stripe-payment.testdata'
import { DonationStatus } from '@prisma/client'
import { RecurringDonationService } from '../../recurring-donation/recurring-donation.service'
import { HttpService } from '@nestjs/axios'
import { mockDeep } from 'jest-mock-extended'
import { NotificationModule } from '../../sockets/notifications/notification.module'
import { DonationsService } from '../donations.service'
import { ExportModule } from '../../export/export.module'

const defaultStripeWebhookEndpoint = '/stripe/webhook'
const stripeSecret = 'wh_123'

describe('StripePaymentService', () => {
  let stripePaymentService: StripePaymentService
  let app: INestApplication
  const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' })

  const moduleConfig: StripeModuleConfig = {
    apiKey: stripeSecret,
    webhookConfig: {
      stripeSecrets: {
        account: stripeSecret,
      },
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
        NotificationModule,
        ExportModule,
      ],
      providers: [
        ConfigService,
        StripePaymentService,
        CampaignService,
        DonationsService,
        MockPrismaService,
        VaultService,
        PersonService,
        RecurringDonationService,
        {
          provide: HttpService,
          useValue: mockDeep<HttpService>(),
        },
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

  it('should handle charge.succeeded for not anonymous user', () => {
    //Set not anonymous explicitly in the test data
    ;(mockChargeEventSucceeded.data.object as Stripe.Charge).metadata.isAnonymous = 'false'

    const payloadString = JSON.stringify(mockChargeEventSucceeded, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    const paymentData = getPaymentDataFromCharge(
      mockChargeEventSucceeded.data.object as Stripe.Charge,
    )

    prismaMock.donation.create.mockResolvedValue({
      id: 'test-donation-id',
      type: DonationType.donation,
      status: DonationStatus.succeeded,
      provider: 'stripe',
      extCustomerId: paymentData.stripeCustomerId ?? '',
      extPaymentIntentId: paymentData.paymentIntentId,
      extPaymentMethodId: 'card',
      targetVaultId: 'test-vault-id',
      amount: paymentData.netAmount,
      chargedAmount: paymentData.netAmount,
      currency: 'BGN',
      createdAt: new Date(),
      updatedAt: new Date(),
      billingName: paymentData.billingName ?? '',
      billingEmail: paymentData.billingEmail ?? '',
      personId: 'donation-person',
    })

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
        expect(mockedDonateToCampaign).toHaveBeenCalled()
        // expect(mockedupdateDonationPayment).toHaveBeenCalled()
        expect(prismaMock.donation.create).toHaveBeenCalled()
        expect(prismaMock.donation.update).toHaveBeenCalledWith({
          where: { id: 'test-donation-id' },
          data: {
            person: {
              connect: {
                email: paymentData.billingEmail,
              },
            },
          },
        })
      })
  })

  it('should handle charge.succeeded for anonymous user', () => {
    //Set anonymous explicitly in the test data
    ;(mockChargeEventSucceeded.data.object as Stripe.Charge).metadata.isAnonymous = 'true'

    const payloadString = JSON.stringify(mockChargeEventSucceeded, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    const paymentData = getPaymentDataFromCharge(
      mockChargeEventSucceeded.data.object as Stripe.Charge,
    )

    prismaMock.donation.create.mockResolvedValue({
      id: 'test-donation-id',
      type: DonationType.donation,
      status: DonationStatus.succeeded,
      provider: 'stripe',
      extCustomerId: paymentData.stripeCustomerId ?? '',
      extPaymentIntentId: paymentData.paymentIntentId,
      extPaymentMethodId: 'card',
      targetVaultId: 'test-vault-id',
      amount: paymentData.netAmount,
      chargedAmount: paymentData.netAmount,
      currency: 'BGN',
      createdAt: new Date(),
      updatedAt: new Date(),
      billingName: paymentData.billingName ?? '',
      billingEmail: paymentData.billingEmail ?? '',
      personId: 'donation-person',
    })

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
        expect(mockedDonateToCampaign).toHaveBeenCalled()
        // expect(mockedupdateDonationPayment).toHaveBeenCalled()
        expect(prismaMock.donation.create).toHaveBeenCalled()
        expect(prismaMock.donation.update).not.toHaveBeenCalled()
      })
  })

  it('should handle customer.subscription.created', () => {
    const payloadString = JSON.stringify(mockCustomerSubscriptionCreated, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const recurring = app.get<RecurringDonationService>(RecurringDonationService)
    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignVault')
      .mockImplementation(() => Promise.resolve(mockedVault))

    //this is executed twice, the first time it returns null, the second time it returns the created subscription
    let created = false

    const mockedCreateRecurringDonation = jest.spyOn(recurring, 'create').mockImplementation(() => {
      created = true
      return Promise.resolve(mockedRecurringDonation)
    })

    const mockedfindSubscriptionByExtId = jest
      .spyOn(recurring, 'findSubscriptionByExtId')
      .mockImplementation(() => {
        if (created) {
          return Promise.resolve(mockedRecurringDonation)
        }
        return Promise.resolve(null)
      })

    const mockedUpdateRecurringService = jest
      .spyOn(recurring, 'updateStatus')
      .mockImplementation(() => {
        return Promise.resolve(mockedRecurringDonation)
      })

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(
          (mockCustomerSubscriptionCreated.data.object as Stripe.SubscriptionItem).metadata
            .campaignId,
        ) //campaignId from the Stripe Event
        expect(mockedfindSubscriptionByExtId).toHaveBeenCalledWith(
          (mockCustomerSubscriptionCreated.data.object as Stripe.SubscriptionItem).id,
        )
        expect(mockedUpdateRecurringService).toHaveBeenCalledWith(
          mockedRecurringDonation.id,
          RecurringDonationStatus.incomplete,
        )
        expect(mockedCreateRecurringDonation).toHaveBeenCalled()
      })
  })

  it('should handle invoice.paid', () => {
    const payloadString = JSON.stringify(mockInvoicePaidEvent, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const donationService = app.get<DonationsService>(DonationsService)
    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    const mockedDonateToCampaign = jest
      .spyOn(campaignService, 'donateToCampaign')
      .mockImplementation(() => Promise.resolve())

    const mockedupdateDonationPayment = jest
      .spyOn(donationService, 'createDonation')
      .mockImplementation(() => Promise.resolve(''))
      .mockName('createDonation')

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(
          (mockCustomerSubscriptionCreated.data.object as Stripe.SubscriptionItem).metadata
            .campaignId,
        ) //campaignId from the Stripe Event
        expect(mockedDonateToCampaign).toHaveBeenCalled()
        expect(mockedupdateDonationPayment).toHaveBeenCalled()
      })
  })

  it('should cancel all active subscriptions if the campaign is completed', () => {
    const payloadString = JSON.stringify(mockInvoicePaidEvent, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const donationService = app.get<DonationsService>(DonationsService)
    const recurring = app.get<RecurringDonationService>(RecurringDonationService)

    const mockCancelSubscription = jest
      .spyOn(recurring, 'cancelSubscription')
      .mockImplementation(() => Promise.resolve(null))

    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaignCompeleted))

    const mockedDonateToCampaign = jest
      .spyOn(campaignService, 'donateToCampaign')
      .mockImplementation(() => Promise.resolve())

    const mockedupdateDonationPayment = jest
      .spyOn(donationService, 'createDonation')
      .mockImplementation(() => Promise.resolve(''))
      .mockName('createDonation')

    const mockFindAllRecurringDonations = jest
      .spyOn(recurring, 'findAllActiveRecurringDonationsByCampaignId')
      .mockImplementation(() => Promise.resolve([mockedRecurringDonation]))

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(
          (mockCustomerSubscriptionCreated.data.object as Stripe.SubscriptionItem).metadata
            .campaignId,
        ) //campaignId from the Stripe Event
        expect(mockedDonateToCampaign).toHaveBeenCalled()
        expect(mockedupdateDonationPayment).toHaveBeenCalled()
        expect(mockCancelSubscription).toHaveBeenCalledWith(
          mockedRecurringDonation.extSubscriptionId,
        )
        expect(mockFindAllRecurringDonations).toHaveBeenCalledWith(
          (mockCustomerSubscriptionCreated.data.object as Stripe.SubscriptionItem).metadata
            .campaignId,
        )
      })
  })
})

it('calculate payment-intent.succeeded with BG tax included in charge', async () => {
  const billingDetails = getPaymentDataFromCharge(
    mockPaymentIntentBGIncluded.latest_charge as Stripe.Charge,
  )
  expect(billingDetails.netAmount).toEqual(1000)
  expect(billingDetails.chargedAmount).toEqual(1063)
})

it('calculate charge.succeeded with BG tax not included in charge', async () => {
  const billingDetails = getPaymentDataFromCharge(
    mockPaymentIntentBGIncludedNot.latest_charge as Stripe.Charge,
  )
  expect(billingDetails.netAmount).toEqual(938)
  expect(billingDetails.chargedAmount).toEqual(1000)
})

it('calculate charge.succeeded with US tax included in charge', async () => {
  const billingDetails = getPaymentDataFromCharge(
    mockPaymentIntentUSIncluded.latest_charge as Stripe.Charge,
  )
  expect(billingDetails.netAmount).toEqual(10000)
  expect(billingDetails.chargedAmount).toEqual(10350)
})

it('calculate charge.succeeded with GB tax included in charge', async () => {
  const billingDetails = getPaymentDataFromCharge(
    mockPaymentIntentUKIncluded.latest_charge as Stripe.Charge,
  )
  expect(billingDetails.netAmount).toEqual(50000)
  expect(billingDetails.chargedAmount).toEqual(51333)
})
