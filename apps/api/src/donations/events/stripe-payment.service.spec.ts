import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { CampaignService } from '../../campaign/campaign.service'
import { StripePaymentService } from './stripe-payment.service'
import { getPaymentData, getPaymentDataFromCharge } from '../helpers/payment-intent-helpers'
import Stripe from 'stripe'
import { VaultService } from '../../vault/vault.service'
import { PersonService } from '../../person/person.service'
import { MockPrismaService, prismaMock } from '../../prisma/prisma-client.mock'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { StripeModule, StripeModuleConfig, StripePayloadService } from '@golevelup/nestjs-stripe'

import {
  Campaign,
  CampaignState,
  Donation,
  DonationType,
  RecurringDonationStatus,
  Vault,
} from '@prisma/client'

import {
  campaignId,
  mockedCampaign,
  mockPaymentEventCancelled,
  mockPaymentEventCreated,
  mockPaymentIntentCreated,
  mockPaymentIntentBGIncluded,
  mockPaymentIntentBGIncludedNot,
  mockPaymentIntentUSIncluded,
  mockPaymentIntentUKIncluded,
  mockCustomerSubscriptionCreated,
  mockedRecurringDonation,
  mockInvoicePaidEvent,
  mockedCampaignCompeleted,
  mockedVault,
  mockChargeEventSucceeded,
  mockPaymentEventFailed,
  mockChargeRefundEventSucceeded,
} from './stripe-payment.testdata'
import { DonationStatus } from '@prisma/client'
import { RecurringDonationService } from '../../recurring-donation/recurring-donation.service'
import { HttpService } from '@nestjs/axios'
import { mockDeep } from 'jest-mock-extended'
import { NotificationModule } from '../../sockets/notifications/notification.module'
import { NotificationsProviderInterface } from '../../notifications/providers/notifications.interface.providers'
import { SendGridNotificationsProvider } from '../../notifications/providers/notifications.sendgrid.provider'
import { MarketingNotificationsService } from '../../notifications/notifications.service'
import { EmailService } from '../../email/email.service'
import { TemplateService } from '../../email/template.service'

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
  const emailServiceMock = {
    sendFromTemplate: jest.fn(() => {
      return true
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        StripeModule.forRootAsync(StripeModule, {
          useFactory: () => moduleConfig,
        }),
        NotificationModule,
      ],
      providers: [
        {
          // Use the interface as token
          provide: NotificationsProviderInterface,
          // But actually provide the service that implements the interface
          useClass: SendGridNotificationsProvider,
        },
        MarketingNotificationsService,
        EmailService,
        TemplateService,
        ConfigService,
        StripePaymentService,
        CampaignService,
        MockPrismaService,
        VaultService,
        PersonService,
        RecurringDonationService,
        {
          provide: HttpService,
          useValue: mockDeep<HttpService>(),
        },
      ],
    })
      .overrideProvider(EmailService)
      .useValue(emailServiceMock)
      .compile()

    app = module.createNestApplication()
    await app.init()

    stripePaymentService = app.get<StripePaymentService>(StripePaymentService)

    //this intercepts the request raw body and removes the exact signature check
    const stripePayloadService = app.get<StripePayloadService>(StripePayloadService)

    jest
      .spyOn(stripePayloadService, 'tryHydratePayload')
      .mockImplementation((_sig, buff) => buff as never)
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

    const mockedUpdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockImplementation(() => Promise.resolve(''))
      .mockName('updateDonationPayment')

    const mockedcreateDonationWish = jest
      .spyOn(campaignService, 'createDonationWish')
      .mockName('createDonationWish')

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(campaignId) //campaignId from the Stripe Event
        expect(mockedcreateDonationWish).not.toHaveBeenCalled()
        expect(mockedUpdateDonationPayment).toHaveBeenCalledWith(
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

    const mockedUpdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockImplementation(() => Promise.resolve(''))
      .mockName('updateDonationPayment')

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(campaignId) //campaignId from the Stripe Event
        expect(mockedUpdateDonationPayment).toHaveBeenCalledWith(
          mockedCampaign,
          paymentData,
          DonationStatus.cancelled,
        )
      })
  })

  it('should handle payment_intent.payment_failed', () => {
    const payloadString = JSON.stringify(mockPaymentEventFailed, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    const paymentData = getPaymentData(mockPaymentEventFailed.data.object as Stripe.PaymentIntent)

    const mockedUpdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockImplementation(() => Promise.resolve(''))
      .mockName('updateDonationPayment')

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(campaignId) //campaignId from the Stripe Event
        expect(mockedUpdateDonationPayment).toHaveBeenCalledWith(
          mockedCampaign,
          paymentData,
          DonationStatus.declined,
        )
      })
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
    const vaultService = app.get<VaultService>(VaultService)

    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    const paymentData = getPaymentDataFromCharge(
      mockChargeEventSucceeded.data.object as Stripe.Charge,
    )

    const mockedcreateDonationWish = jest
      .spyOn(campaignService, 'createDonationWish')
      .mockName('createDonationWish')
      .mockImplementation(() => Promise.resolve())

    prismaMock.donation.findUnique.mockResolvedValue({
      id: 'test-donation-id',
      type: DonationType.donation,
      status: DonationStatus.waiting,
      provider: 'stripe',
      extCustomerId: paymentData.stripeCustomerId ?? '',
      extPaymentIntentId: paymentData.paymentIntentId,
      extPaymentMethodId: 'card',
      targetVaultId: 'test-vault-id',
      amount: 0, //amount is 0 on donation created from payment-intent
      chargedAmount: 0,
      currency: 'BGN',
      createdAt: new Date(),
      updatedAt: new Date(),
      billingName: paymentData.billingName ?? '',
      billingEmail: paymentData.billingEmail ?? '',
      personId: 'donation-person',
    })

    prismaMock.donation.update.mockResolvedValue({
      id: 'test-donation-id',
      targetVaultId: 'test-vault-id',
      amount: paymentData.netAmount,
      status: 'succeeded',
      person: { firstName: 'Full', lastName: 'Name' },
    } as Donation & { person: unknown })

    prismaMock.vault.update.mockResolvedValue({ campaignId: 'test-campaign' } as Vault)

    prismaMock.campaign.findFirst.mockResolvedValue({
      id: 'test-campaign',
      state: CampaignState.active,
      targetAmount: paymentData.netAmount,
      vaults: [{ amount: paymentData.netAmount }],
    } as unknown as Campaign)

    jest.spyOn(prismaMock, '$transaction').mockImplementation((callback) => callback(prismaMock))
    const mockedUpdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockName('updateDonationPayment')

    const mockedIncrementVaultAmount = jest.spyOn(vaultService, 'incrementVaultAmount')

    const mockedUpdateCampaignStatusIfTargetReached = jest.spyOn(
      campaignService,
      'updateCampaignStatusIfTargetReached',
    )

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(campaignId) //campaignId from the Stripe Event
        expect(mockedUpdateDonationPayment).toHaveBeenCalled()
        expect(prismaMock.donation.findUnique).toHaveBeenCalled()
        expect(prismaMock.donation.create).not.toHaveBeenCalled()
        expect(mockedIncrementVaultAmount).toHaveBeenCalled()
        expect(prismaMock.donation.update).toHaveBeenCalledTimes(2) //once for the amount and second time for assigning donation to the person
        expect(mockedUpdateCampaignStatusIfTargetReached).toHaveBeenCalled()
        expect(prismaMock.campaign.update).toHaveBeenCalledWith({
          where: {
            id: 'test-campaign',
          },
          data: {
            state: CampaignState.complete,
          },
        })
        expect(mockedcreateDonationWish).toHaveBeenCalled()
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
    const vaultService = app.get<VaultService>(VaultService)

    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    const paymentData = getPaymentDataFromCharge(
      mockChargeEventSucceeded.data.object as Stripe.Charge,
    )

    const mockedcreateDonationWish = jest
      .spyOn(campaignService, 'createDonationWish')
      .mockName('createDonationWish')
      .mockImplementation(() => Promise.resolve())

    prismaMock.donation.findUnique.mockResolvedValue({
      id: 'test-donation-id',
      type: DonationType.donation,
      status: DonationStatus.waiting,
      provider: 'stripe',
      extCustomerId: paymentData.stripeCustomerId ?? '',
      extPaymentIntentId: paymentData.paymentIntentId,
      extPaymentMethodId: 'card',
      targetVaultId: 'test-vault-id',
      amount: 0, //amount is 0 on donation created from payment-intent
      chargedAmount: 0,
      currency: 'BGN',
      createdAt: new Date(),
      updatedAt: new Date(),
      billingName: paymentData.billingName ?? '',
      billingEmail: paymentData.billingEmail ?? '',
      personId: 'donation-person',
    })

    prismaMock.donation.update.mockResolvedValue({
      id: 'test-donation-id',
      targetVaultId: 'test-vault-id',
      amount: (mockInvoicePaidEvent.data.object as Stripe.Invoice).amount_paid,
      status: 'succeeded',
      person: { firstName: 'Full', lastName: 'Name' },
    } as Donation & { person: unknown })

    prismaMock.vault.update.mockResolvedValue({ campaignId: 'test-campaign' } as Vault)

    jest.spyOn(prismaMock, '$transaction').mockImplementation((callback) => callback(prismaMock))
    const mockedUpdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockName('updateDonationPayment')

    const mockedIncrementVaultAmount = jest.spyOn(vaultService, 'incrementVaultAmount')

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(campaignId) //campaignId from the Stripe Event
        expect(mockedUpdateDonationPayment).toHaveBeenCalled()
        expect(prismaMock.donation.findUnique).toHaveBeenCalled()
        expect(prismaMock.donation.create).not.toHaveBeenCalled()
        expect(prismaMock.donation.update).toHaveBeenCalledOnce() //for the donation to succeeded
        expect(mockedIncrementVaultAmount).toHaveBeenCalled()
        expect(mockedcreateDonationWish).toHaveBeenCalled()
      })
  })

  it('should handle charge.refunded', () => {
    const payloadString = JSON.stringify(mockChargeRefundEventSucceeded, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const vaultService = app.get<VaultService>(VaultService)

    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    const paymentData = getPaymentDataFromCharge(
      mockChargeEventSucceeded.data.object as Stripe.Charge,
    )

    prismaMock.donation.findUnique.mockResolvedValue({
      id: 'test-donation-id',
      type: DonationType.donation,
      status: DonationStatus.succeeded,
      provider: 'stripe',
      extCustomerId: paymentData.stripeCustomerId ?? '',
      extPaymentIntentId: paymentData.paymentIntentId,
      extPaymentMethodId: 'card',
      targetVaultId: 'test-vault-id',
      amount: 1000, //amount is 0 on donation created from payment-intent
      chargedAmount: 800,
      currency: 'BGN',
      createdAt: new Date(),
      updatedAt: new Date(),
      billingName: paymentData.billingName ?? '',
      billingEmail: paymentData.billingEmail ?? '',
      personId: 'donation-person',
    })

    prismaMock.donation.update.mockResolvedValue({
      id: 'test-donation-id',
      targetVaultId: 'test-vault-id',
      amount: paymentData.netAmount,
      status: DonationStatus.refund,
      person: { firstName: 'Full', lastName: 'Name' },
    } as Donation & { person: unknown })

    prismaMock.vault.update.mockResolvedValue({ campaignId: 'test-campaign' } as Vault)

    prismaMock.campaign.findFirst.mockResolvedValue({
      id: 'test-campaign',
      state: CampaignState.active,
      targetAmount: paymentData.netAmount,
      vaults: [{ amount: paymentData.netAmount }],
    } as unknown as Campaign)

    jest.spyOn(prismaMock, '$transaction').mockImplementation((callback) => callback(prismaMock))
    const mockedUpdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockName('updateDonationPayment')

    const mockDecremementVaultAmount = jest.spyOn(vaultService, 'decrementVaultAmount')

    return request(app.getHttpServer())
      .post(defaultStripeWebhookEndpoint)
      .set('stripe-signature', header)
      .type('json')
      .send(payloadString)
      .expect(201)
      .then(() => {
        expect(mockedCampaignById).toHaveBeenCalledWith(campaignId) //campaignId from the Stripe Event
        expect(mockedUpdateDonationPayment).toHaveBeenCalled()
        expect(prismaMock.donation.findUnique).toHaveBeenCalled()
        expect(prismaMock.donation.create).not.toHaveBeenCalled()
        expect(mockDecremementVaultAmount).toHaveBeenCalled()
        expect(prismaMock.donation.update).toHaveBeenCalled()
      })
  })

  it('calculate payment-intent.created', async () => {
    const billingDetails = getPaymentData(mockPaymentIntentCreated)
    expect(billingDetails.netAmount).toEqual(0)
    expect(billingDetails.chargedAmount).toEqual(1065)
  })

  it('calculate payment-intent.succeeded with BG tax included in charge', async () => {
    const billingDetails = getPaymentData(
      mockPaymentIntentBGIncluded,
      mockPaymentIntentBGIncluded.latest_charge as Stripe.Charge,
    )
    expect(billingDetails.netAmount).toEqual(1000)
    expect(billingDetails.chargedAmount).toEqual(1063)
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
    const vaultService = app.get<VaultService>(VaultService)

    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaign))

    jest.spyOn(prismaMock, '$transaction').mockImplementation((callback) => callback(prismaMock))

    const mockedUpdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockName('updateDonationPayment')

    prismaMock.donation.findFirst.mockResolvedValue({
      targetVaultId: '1',
      amount: (mockInvoicePaidEvent.data.object as Stripe.Invoice).amount_paid,
      status: 'initial',
    } as Donation)

    prismaMock.donation.update.mockResolvedValue({
      targetVaultId: '1',
      amount: (mockInvoicePaidEvent.data.object as Stripe.Invoice).amount_paid,
      status: 'initial',
      person: {},
    } as Donation & { person: unknown })

    const mockedIncrementVaultAmount = jest
      .spyOn(vaultService, 'incrementVaultAmount')
      .mockImplementation()

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
        expect(mockedUpdateDonationPayment).toHaveBeenCalled()
        expect(mockedIncrementVaultAmount).toHaveBeenCalled()
      })
  })

  it('should cancel all active subscriptions if the campaign is completed', () => {
    const payloadString = JSON.stringify(mockInvoicePaidEvent, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeSecret,
    })

    const campaignService = app.get<CampaignService>(CampaignService)
    const recurring = app.get<RecurringDonationService>(RecurringDonationService)

    const mockCancelSubscription = jest
      .spyOn(recurring, 'cancelSubscription')
      .mockImplementation(() => Promise.resolve(null))

    const mockedCampaignById = jest
      .spyOn(campaignService, 'getCampaignById')
      .mockImplementation(() => Promise.resolve(mockedCampaignCompeleted))

    const mockedUpdateDonationPayment = jest
      .spyOn(campaignService, 'updateDonationPayment')
      .mockImplementation(() => Promise.resolve(''))
      .mockName('updateDonationPayment')

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
        expect(mockedUpdateDonationPayment).toHaveBeenCalled()
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

it('calculate payment-intent.succeeded with BG tax not included in charge', async () => {
  const billingDetails = getPaymentData(
    mockPaymentIntentBGIncludedNot,
    mockPaymentIntentBGIncludedNot.latest_charge as Stripe.Charge,
  )
  expect(billingDetails.netAmount).toEqual(938)
  expect(billingDetails.chargedAmount).toEqual(1000)
})

it('calculate payment-intent.succeeded with US tax included in charge', async () => {
  const billingDetails = getPaymentData(
    mockPaymentIntentUSIncluded,
    mockPaymentIntentUSIncluded.latest_charge as Stripe.Charge,
  )
  expect(billingDetails.netAmount).toEqual(10000)
  expect(billingDetails.chargedAmount).toEqual(10350)
})

it('calculate payment-intent.succeeded with GB tax included in charge', async () => {
  const billingDetails = getPaymentData(
    mockPaymentIntentUKIncluded,
    mockPaymentIntentUKIncluded.latest_charge as Stripe.Charge,
  )
  expect(billingDetails.netAmount).toEqual(50000)
  expect(billingDetails.chargedAmount).toEqual(51333)
})
