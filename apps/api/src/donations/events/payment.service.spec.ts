import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { CampaignService } from '../../campaign/campaign.service'
import { PaymentSucceededService } from './payment-intent-succeeded.service'
import { getPaymentData } from '../helpers/payment-intent-helpers'
import Stripe from 'stripe'
import { VaultService } from '../../vault/vault.service'
import { PersonService } from '../../person/person.service'
import { MockPrismaService } from '../../prisma/prisma-client.mock'

describe('PaymentService', () => {
  let service: PaymentSucceededService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        PaymentSucceededService,
        CampaignService,
        MockPrismaService,
        VaultService,
        PersonService,
      ],
    }).compile()

    service = module.get<PaymentSucceededService>(PaymentSucceededService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('accept payment-intent.created', async () => {
    const mockPaymentIntentCreated: Stripe.PaymentIntent = {
      id: 'pi_3LNwijKApGjVGa9t1F9QYd5s',
      object: 'payment_intent',
      amount: 1065,
      amount_capturable: 0,
      amount_details: {
        tip: {},
      },
      amount_received: 0,
      application: null,
      application_fee_amount: null,
      automatic_payment_methods: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'automatic',
      charges: {
        object: 'list',
        data: [],
        has_more: false,
        url: '/v1/charges?payment_intent=pi_3LNwijKApGjVGa9t1F9QYd5s',
      },
      client_secret: 'pi_3LNwijKApGjVGa9t1F9QYd5s_secret_jzUiho9wsoUGHIQLtmPb6Hxsd',
      confirmation_method: 'automatic',
      created: 1658399705,
      currency: 'bgn',
      customer: null,
      description: null,
      invoice: null,
      last_payment_error: null,
      livemode: false,
      metadata: {
        campaignId: '4c1616b0-1284-4b7d-8b89-9098e7ded2c4',
      },
      next_action: null,
      on_behalf_of: null,
      payment_method: null,
      payment_method_options: {
        card: {
          installments: null,
          mandate_options: null,
          network: null,
          request_three_d_secure: 'automatic',
        },
      },
      payment_method_types: ['card'],
      processing: null,
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'requires_payment_method',
      transfer_data: null,
      transfer_group: null,
    }

    const billingDetails = getPaymentData(mockPaymentIntentCreated)
    expect(billingDetails.netAmount).toEqual(0)
    expect(billingDetails.chargedAmount).toEqual(1065)
  })

  it('accept payment-intent.succeeded with BG tax included in charge', async () => {
    const mockPaymentIntentCreated: Stripe.PaymentIntent = {
      id: 'pi_3LNwijKApGjVGa9t1F9QYd5s',
      object: 'payment_intent',
      amount: 1065,
      amount_capturable: 0,
      amount_details: {
        tip: {},
      },
      amount_received: 1065,
      application: null,
      application_fee_amount: null,
      automatic_payment_methods: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'automatic',
      charges: {
        object: 'list',
        data: [
          {
            id: 'ch_3LNwijKApGjVGa9t1tuRzvbL',
            object: 'charge',
            amount: 1065,
            amount_captured: 1065,
            amount_refunded: 0,
            application: null,
            application_fee: null,
            application_fee_amount: null,
            balance_transaction: 'txn_3LNwijKApGjVGa9t100xnggj',
            billing_details: {
              address: {
                city: null,
                country: 'BG',
                line1: null,
                line2: null,
                postal_code: null,
                state: null,
              },
              email: 'igoychev@gmail.com',
              name: 'Ivan Goychev',
              phone: null,
            },
            calculated_statement_descriptor: 'PODKREPI.BG',
            captured: true,
            created: 1658399779,
            currency: 'bgn',
            customer: 'cus_M691kVNYuUp4po',
            description: null,
            destination: null,
            dispute: null,
            disputed: false,
            failure_balance_transaction: null,
            failure_code: null,
            failure_message: null,
            fraud_details: {},
            invoice: null,
            livemode: false,
            metadata: {
              campaignId: '4c1616b0-1284-4b7d-8b89-9098e7ded2c4',
            },
            on_behalf_of: null,
            outcome: {
              network_status: 'approved_by_network',
              reason: null,
              risk_level: 'normal',
              risk_score: 33,
              seller_message: 'Payment complete.',
              type: 'authorized',
            },
            paid: true,
            payment_intent: 'pi_3LNwijKApGjVGa9t1F9QYd5s',
            payment_method: 'pm_1LNwjtKApGjVGa9thtth9iu7',
            payment_method_details: {
              card: {
                brand: 'visa',
                checks: {
                  address_line1_check: null,
                  address_postal_code_check: null,
                  cvc_check: 'pass',
                },
                country: 'BG',
                exp_month: 4,
                exp_year: 2024,
                fingerprint: 'iCySKWAAAZGp2hwr',
                funding: 'credit',
                installments: null,
                last4: '0000',
                mandate: null,
                network: 'visa',
                three_d_secure: null,
                wallet: null,
              },
              type: 'card',
            },
            receipt_email: 'igoychev@gmail.com',
            receipt_number: null,
            receipt_url:
              'https://pay.stripe.com/receipts/acct_1IRdsUKApGjVGa9t/ch_3LNwijKApGjVGa9t1tuRzvbL/rcpt_M691CdDekzigzPrzweBnW9Db2nRHHZl',
            refunded: false,
            refunds: {
              object: 'list',
              data: [],
              has_more: false,
              url: '/v1/charges/ch_3LNwijKApGjVGa9t1tuRzvbL/refunds',
            },
            review: null,
            shipping: null,
            source: null,
            source_transfer: null,
            statement_descriptor: null,
            statement_descriptor_suffix: null,
            status: 'succeeded',
            transfer_data: null,
            transfer_group: null,
          },
        ],
        has_more: false,
        url: '/v1/charges?payment_intent=pi_3LNwijKApGjVGa9t1F9QYd5s',
      },
      client_secret: 'pi_3LNwijKApGjVGa9t1F9QYd5s_secret_jzUiho9wsoUGHIQLtmPb6Hxsd',
      confirmation_method: 'automatic',
      created: 1658399705,
      currency: 'bgn',
      customer: 'cus_M691kVNYuUp4po',
      description: null,
      invoice: null,
      last_payment_error: null,
      livemode: false,
      metadata: {
        campaignId: '4c1616b0-1284-4b7d-8b89-9098e7ded2c4',
      },
      next_action: null,
      on_behalf_of: null,
      payment_method: 'pm_1LNwjtKApGjVGa9thtth9iu7',
      payment_method_options: {
        card: {
          installments: null,
          mandate_options: null,
          network: null,
          request_three_d_secure: 'automatic',
        },
      },
      payment_method_types: ['card'],
      processing: null,
      receipt_email: 'igoychev@gmail.com',
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'succeeded',
      transfer_data: null,
      transfer_group: null,
    }

    const billingDetails = getPaymentData(mockPaymentIntentCreated)
    expect(billingDetails.netAmount).toEqual(1000)
    expect(billingDetails.chargedAmount).toEqual(1065)
  })
})

it('accept payment-intent.succeeded with BG tax not included in charge', async () => {
  const mockPaymentIntentCreated: Stripe.PaymentIntent = {
    id: 'pi_3LNwkHKApGjVGa9t1TLyVofD',
    object: 'payment_intent',
    amount: 1000,
    amount_capturable: 0,
    amount_details: {
      tip: {},
    },
    amount_received: 1000,
    application: null,
    application_fee_amount: null,
    automatic_payment_methods: null,
    canceled_at: null,
    cancellation_reason: null,
    capture_method: 'automatic',
    charges: {
      object: 'list',
      data: [
        {
          id: 'ch_3LNwkHKApGjVGa9t1bkp20zi',
          object: 'charge',
          amount: 1000,
          amount_captured: 1000,
          amount_refunded: 0,
          application: null,
          application_fee: null,
          application_fee_amount: null,
          balance_transaction: 'txn_3LNwkHKApGjVGa9t1EH1EZxk',
          billing_details: {
            address: {
              city: null,
              country: 'BG',
              line1: null,
              line2: null,
              postal_code: null,
              state: null,
            },
            email: 'igoychev@gmail.com',
            name: 'nepokriti',
            phone: null,
          },
          calculated_statement_descriptor: 'PODKREPI.BG',
          captured: true,
          created: 1658399823,
          currency: 'bgn',
          customer: 'cus_M692d4eal3rlWR',
          description: null,
          destination: null,
          dispute: null,
          disputed: false,
          failure_balance_transaction: null,
          failure_code: null,
          failure_message: null,
          fraud_details: {},
          invoice: null,
          livemode: false,
          metadata: {
            campaignId: '4c1616b0-1284-4b7d-8b89-9098e7ded2c4',
          },
          on_behalf_of: null,
          outcome: {
            network_status: 'approved_by_network',
            reason: null,
            risk_level: 'normal',
            risk_score: 20,
            seller_message: 'Payment complete.',
            type: 'authorized',
          },
          paid: true,
          payment_intent: 'pi_3LNwkHKApGjVGa9t1TLyVofD',
          payment_method: 'pm_1LNwkbKApGjVGa9tmWVdg46e',
          payment_method_details: {
            card: {
              brand: 'visa',
              checks: {
                address_line1_check: null,
                address_postal_code_check: null,
                cvc_check: 'pass',
              },
              country: 'BG',
              exp_month: 4,
              exp_year: 2032,
              fingerprint: 'iCySKWAAAZGp2hwr',
              funding: 'credit',
              installments: null,
              last4: '0000',
              mandate: null,
              network: 'visa',
              three_d_secure: null,
              wallet: null,
            },
            type: 'card',
          },
          receipt_email: 'igoychev@gmail.com',
          receipt_number: null,
          receipt_url:
            'https://pay.stripe.com/receipts/acct_1IRdsUKApGjVGa9t/ch_3LNwkHKApGjVGa9t1bkp20zi/rcpt_M692vTcZd70YrFw4T5L2nXpOqtXNgMj',
          refunded: false,
          refunds: {
            object: 'list',
            data: [],
            has_more: false,
            url: '/v1/charges/ch_3LNwkHKApGjVGa9t1bkp20zi/refunds',
          },
          review: null,
          shipping: null,
          source: null,
          source_transfer: null,
          statement_descriptor: null,
          statement_descriptor_suffix: null,
          status: 'succeeded',
          transfer_data: null,
          transfer_group: null,
        },
      ],
      has_more: false,
      url: '/v1/charges?payment_intent=pi_3LNwkHKApGjVGa9t1TLyVofD',
    },
    client_secret: 'pi_3LNwkHKApGjVGa9t1TLyVofD_secret_ReaQ2jyYtUpC0zvQoPPi3Jo0p',
    confirmation_method: 'automatic',
    created: 1658399801,
    currency: 'bgn',
    customer: 'cus_M692d4eal3rlWR',
    description: null,
    invoice: null,
    last_payment_error: null,
    livemode: false,
    metadata: {
      campaignId: '4c1616b0-1284-4b7d-8b89-9098e7ded2c4',
    },
    next_action: null,
    on_behalf_of: null,
    payment_method: 'pm_1LNwkbKApGjVGa9tmWVdg46e',
    payment_method_options: {
      card: {
        installments: null,
        mandate_options: null,
        network: null,
        request_three_d_secure: 'automatic',
      },
    },
    payment_method_types: ['card'],
    processing: null,
    receipt_email: 'igoychev@gmail.com',
    review: null,
    setup_future_usage: null,
    shipping: null,
    source: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    status: 'succeeded',
    transfer_data: null,
    transfer_group: null,
  }

  const billingDetails = getPaymentData(mockPaymentIntentCreated)
  expect(billingDetails.netAmount).toEqual(936)
  expect(billingDetails.chargedAmount).toEqual(1000)
})
