import { Campaign, CampaignState, RecurringDonation } from '@prisma/client'
import { randomUUID } from 'crypto'
import Stripe from 'stripe'

export const campaignId = '4c1616b0-1284-4b7d-8b89-9098e7ded2c4'

export const mockedCampaign: Campaign = {
  id: campaignId,
  slug: 'test-campaign',
  state: CampaignState.active,
  title: 'test-campaigns',
  paymentReference: 'test-campaign',
  essence: 'test-campaign',
  coordinatorId: randomUUID(),
  organizerId: randomUUID(),
  companyId: randomUUID(),
  beneficiaryId: randomUUID(),
  approvedById: randomUUID(),
  campaignTypeId: randomUUID(),
  targetAmount: 1000000,
  currency: 'BGN',
  allowDonationOnComplete: true,
  startDate: new Date(),
  endDate: null,
  description: 'test campaign',
  createdAt: new Date(),
  updatedAt: null,
  deletedAt: null,
}

export const mockedCampaignCompeleted: Campaign = {
  id: campaignId,
  slug: 'test-campaign',
  state: CampaignState.complete,
  title: 'test-campaigns',
  paymentReference: 'test-campaign',
  essence: 'test-campaign',
  coordinatorId: randomUUID(),
  organizerId: randomUUID(),
  companyId: randomUUID(),
  beneficiaryId: randomUUID(),
  approvedById: randomUUID(),
  campaignTypeId: randomUUID(),
  targetAmount: 1000000,
  currency: 'BGN',
  allowDonationOnComplete: true,
  startDate: new Date(),
  endDate: null,
  description: 'test campaign',
  createdAt: new Date(),
  updatedAt: null,
  deletedAt: null,
}

export const mockPaymentEventCreated: Stripe.Event = {
  id: 'evt_3LVL6OKApGjVGa9t0FRX71DK',
  object: 'event',
  api_version: '2020-08-27',
  created: 1660161724,
  data: {
    object: {
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
      client_secret: null,
      confirmation_method: 'automatic',
      created: 1658399705,
      currency: 'bgn',
      customer: null,
      description: null,
      invoice: null,
      last_payment_error: null,
      livemode: false,
      metadata: {
        campaignId: campaignId,
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
    },
  },
  livemode: true,
  pending_webhooks: 1,
  request: {
    id: 'req_7euTKmWEGWWBSy',
    idempotency_key: 'd2294891-8bf7-4955-8d78-e6e54e306eec',
  },
  type: 'payment_intent.created',
}

export const mockPaymentEventCancelled: Stripe.Event = {
  id: 'evt_3LUzB4KApGjVGa9t0lyGsAk8',
  object: 'event',
  api_version: '2020-08-27',
  created: 1660163846,
  data: {
    object: {
      id: 'pi_3LUzB4KApGjVGa9t0NGvE94K',
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
      canceled_at: 1660163846,
      cancellation_reason: 'automatic',
      capture_method: 'automatic',
      charges: {
        object: 'list',
        data: [],
        has_more: false,
        total_count: 0,
        url: '/v1/charges?payment_intent=pi_3LUzB4KApGjVGa9t0NGvE94K',
      },
      client_secret: 'pi',
      confirmation_method: 'automatic',
      created: 1660077446,
      currency: 'bgn',
      customer: null,
      description: null,
      invoice: null,
      last_payment_error: null,
      livemode: false,
      metadata: {
        campaignId: campaignId,
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
      status: 'canceled',
      transfer_data: null,
      transfer_group: null,
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: '8a2367c4-45bc-40a0-86c0-cff4c2229bec',
  },
  type: 'payment_intent.canceled',
}

export const mockPaymentEventSucceeded: Stripe.Event = {
  id: 'evt_3LTS7pKApGjVGa9t1kScg2Sl',
  object: 'event',
  api_version: '2020-08-27',
  created: 1659712067,
  data: {
    object: {
      id: 'pi_3LTS7pKApGjVGa9t1TOCL7Fm',
      object: 'payment_intent',
      amount: 2000,
      amount_capturable: 0,
      amount_details: {
        tip: {},
      },
      amount_received: 2000,
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
            id: 'ch_3LTS7pKApGjVGa9t1DYHNd5O',
            object: 'charge',
            amount: 2000,
            amount_captured: 2000,
            amount_refunded: 0,
            application: null,
            application_fee: null,
            application_fee_amount: null,
            balance_transaction: 'txn_3LTS7pKApGjVGa9t1Ucmz2e7',
            billing_details: {
              address: {
                city: null,
                country: null,
                line1: null,
                line2: null,
                postal_code: null,
                state: null,
              },
              email: null,
              name: null,
              phone: null,
            },
            calculated_statement_descriptor: 'PODKREPI.BG',
            captured: true,
            created: 1659712066,
            currency: 'bgn',
            customer: null,
            description: '(created by Stripe CLI)',
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
              campaignId: campaignId,
            },
            on_behalf_of: null,
            order: null,
            outcome: {
              network_status: 'approved_by_network',
              reason: null,
              risk_level: 'normal',
              risk_score: 56,
              seller_message: 'Payment complete.',
              type: 'authorized',
            },
            paid: true,
            payment_intent: 'pi_3LTS7pKApGjVGa9t1TOCL7Fm',
            payment_method: 'pm_1LTS7pKApGjVGa9temSutZsY',
            payment_method_details: {
              card: {
                brand: 'visa',
                checks: {
                  address_line1_check: null,
                  address_postal_code_check: null,
                  cvc_check: null,
                },
                country: 'US',
                exp_month: 8,
                exp_year: 2023,
                fingerprint: 'test',
                funding: 'credit',
                installments: null,
                last4: '4242',
                mandate: null,
                network: 'visa',
                three_d_secure: null,
                wallet: null,
              },
              type: 'card',
            },
            receipt_email: null,
            receipt_number: null,
            receipt_url: 'https://pay.stripe.com/receipts/',
            refunded: false,
            refunds: {
              object: 'list',
              data: [],
              has_more: false,
              total_count: 0,
              url: '/v1/charges/ch_3LT/refunds',
            },
            review: null,
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
        total_count: 1,
        url: '/v1/charges?payment_intent=pi_3LTS7pKApGjVGa9t1TOCL7Fm',
      },
      client_secret: 'test',
      confirmation_method: 'automatic',
      created: 1659712065,
      currency: 'bgn',
      customer: null,
      description: '(created by Stripe CLI)',
      invoice: null,
      last_payment_error: null,
      livemode: false,
      metadata: {
        campaignId: campaignId,
      },
      next_action: null,
      on_behalf_of: null,
      payment_method: 'pm_1LTS7pKApGjVGa9temSutZsY',
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
      source: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'succeeded',
      transfer_data: null,
      transfer_group: null,
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_Qu7euzq1m8tuIF',
    idempotency_key: 'e9653991-289c-449f-8544-ad0744ccc803',
  },
  type: 'payment_intent.succeeded',
}

export const mockPaymentIntentCreated: Stripe.PaymentIntent = {
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
  client_secret: null,
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

export const mockPaymentIntentBGIncluded: Stripe.PaymentIntent = {
  id: 'pi_3LNwijKApGjVGa9t1F9QYd5s',
  object: 'payment_intent',
  amount: 1063,
  amount_capturable: 0,
  amount_details: {
    tip: {},
  },
  amount_received: 1063,
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
        amount: 1063,
        amount_captured: 1063,
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
          email: 'test@gmail.com',
          name: 'First Last',
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
        receipt_email: 'test@gmail.com',
        receipt_number: null,
        receipt_url: 'https://pay.stripe.com/receipts/',
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
  client_secret: 'xxx',
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
  receipt_email: 'test@gmail.com',
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

export const mockPaymentIntentBGIncludedNot: Stripe.PaymentIntent = {
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
          email: 'test@gmail.com',
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
        receipt_email: 'test@gmail.com',
        receipt_number: null,
        receipt_url: 'https://pay.stripe.com/receipts/',
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
  client_secret: null,
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
  receipt_email: 'test@gmail.com',
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

export const mockPaymentIntentUSIncluded: Stripe.PaymentIntent = {
  id: 'pi_3LNziFKApGjVGa9t0sfUl30h',
  object: 'payment_intent',
  amount: 10350,
  amount_capturable: 0,
  amount_details: {
    tip: {},
  },
  amount_received: 10350,
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
        id: 'ch_3LNziFKApGjVGa9t07WB0NNl',
        object: 'charge',
        amount: 10350,
        amount_captured: 10350,
        amount_refunded: 0,
        application: null,
        application_fee: null,
        application_fee_amount: null,
        balance_transaction: 'txn_3LNziFKApGjVGa9t0H3v9oKL',
        billing_details: {
          address: {
            city: null,
            country: 'BG',
            line1: null,
            line2: null,
            postal_code: null,
            state: null,
          },
          email: 'test@gmail.com',
          name: '42424242',
          phone: null,
        },
        calculated_statement_descriptor: 'PODKREPI.BG',
        captured: true,
        created: 1658411254,
        currency: 'bgn',
        customer: 'cus_M6C76vpsFglyGh',
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
          campaignId: 'ef592bd8-edd8-42a0-95c0-0e97d26d8045',
        },
        on_behalf_of: null,
        outcome: {
          network_status: 'approved_by_network',
          reason: null,
          risk_level: 'normal',
          risk_score: 56,
          seller_message: 'Payment complete.',
          type: 'authorized',
        },
        paid: true,
        payment_intent: 'pi_3LNziFKApGjVGa9t0sfUl30h',
        payment_method: 'pm_1LNziyKApGjVGa9tOR1sWkMV',
        payment_method_details: {
          card: {
            brand: 'visa',
            checks: {
              address_line1_check: null,
              address_postal_code_check: null,
              cvc_check: 'pass',
            },
            country: 'US',
            exp_month: 4,
            exp_year: 2024,
            fingerprint: '2BUDwUpZNgnepjrE',
            funding: 'credit',
            installments: null,
            last4: '4242',
            mandate: null,
            network: 'visa',
            three_d_secure: null,
            wallet: null,
          },
          type: 'card',
        },
        receipt_email: 'test@gmail.com',
        receipt_number: null,
        receipt_url: 'https://pay.stripe.com/receipts/',
        refunded: false,
        refunds: {
          object: 'list',
          data: [],
          has_more: false,
          url: '/v1/charges/ch_3LNziFKApGjVGa9t07WB0NNl/refunds',
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
    url: '/v1/charges?payment_intent=pi_3LNziFKApGjVGa9t0sfUl30h',
  },
  client_secret: null,
  confirmation_method: 'automatic',
  created: 1658411207,
  currency: 'bgn',
  customer: 'cus_M6C76vpsFglyGh',
  description: null,
  invoice: null,
  last_payment_error: null,
  livemode: false,
  metadata: {
    campaignId: 'ef592bd8-edd8-42a0-95c0-0e97d26d8045',
  },
  next_action: null,
  on_behalf_of: null,
  payment_method: 'pm_1LNziyKApGjVGa9tOR1sWkMV',
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
  receipt_email: 'test@gmail.com',
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

export const mockPaymentIntentUKIncluded: Stripe.PaymentIntent = {
  id: 'pi_3LO0M5KApGjVGa9t07SXIaeQ',
  object: 'payment_intent',
  amount: 51333,
  amount_capturable: 0,
  amount_details: {
    tip: {},
  },
  amount_received: 51333,
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
        id: 'ch_3LO0M5KApGjVGa9t0KGO6jEG',
        object: 'charge',
        amount: 51333,
        amount_captured: 51333,
        amount_refunded: 0,
        application: null,
        application_fee: null,
        application_fee_amount: null,
        balance_transaction: 'txn_3LO0M5KApGjVGa9t0nyzXKN6',
        billing_details: {
          address: {
            city: null,
            country: 'BG',
            line1: null,
            line2: null,
            postal_code: null,
            state: null,
          },
          email: 'test@gmail.com',
          name: 'uk card',
          phone: null,
        },
        calculated_statement_descriptor: 'PODKREPI.BG',
        captured: true,
        created: 1658413695,
        currency: 'bgn',
        customer: 'cus_M6ClvMHGb5Y4LI',
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
          campaignId: 'ef592bd8-edd8-42a0-95c0-0e97d26d8045',
        },
        on_behalf_of: null,
        outcome: {
          network_status: 'approved_by_network',
          reason: null,
          risk_level: 'normal',
          risk_score: 13,
          seller_message: 'Payment complete.',
          type: 'authorized',
        },
        paid: true,
        payment_intent: 'pi_3LO0M5KApGjVGa9t07SXIaeQ',
        payment_method: 'pm_1LO0MLKApGjVGa9tT5zcUHVU',
        payment_method_details: {
          card: {
            brand: 'visa',
            checks: {
              address_line1_check: null,
              address_postal_code_check: null,
              cvc_check: 'pass',
            },
            country: 'GB',
            exp_month: 12,
            exp_year: 2031,
            fingerprint: '4rDyVIWfTHNh1yf5',
            funding: 'debit',
            installments: null,
            last4: '0005',
            mandate: null,
            network: 'visa',
            three_d_secure: null,
            wallet: null,
          },
          type: 'card',
        },
        receipt_email: 'test@gmail.com',
        receipt_number: null,
        receipt_url: 'https://pay.stripe.com/receipts/',
        refunded: false,
        refunds: {
          object: 'list',
          data: [],
          has_more: false,
          url: '/v1/charges/ch_3LO0M5KApGjVGa9t0KGO6jEG/refunds',
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
    url: '/v1/charges?payment_intent=pi_3LO0M5KApGjVGa9t07SXIaeQ',
  },
  client_secret: null,
  confirmation_method: 'automatic',
  created: 1658413677,
  currency: 'bgn',
  customer: 'cus_M6ClvMHGb5Y4LI',
  description: null,
  invoice: null,
  last_payment_error: null,
  livemode: false,
  metadata: {
    campaignId: 'ef592bd8-edd8-42a0-95c0-0e97d26d8045',
  },
  next_action: null,
  on_behalf_of: null,
  payment_method: 'pm_1LO0MLKApGjVGa9tT5zcUHVU',
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
  receipt_email: 'test@gmail.com',
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

export const mockCustomerSubscriptionCreated: Stripe.Event = {
  id: 'evt_1MCs25FIrMXL5nkaYRibZXAc',
  object: 'event',
  api_version: '2022-08-01',
  created: 1670536411,
  data: {
    object: {
      id: 'sub_1MCs22FIrMXL5nkaztW6rLaD',
      object: 'subscription',
      application: null,
      application_fee_percent: null,
      automatic_tax: {
        enabled: false,
      },
      billing_cycle_anchor: 1670536410,
      billing_thresholds: null,
      cancel_at: null,
      cancel_at_period_end: false,
      canceled_at: null,
      collection_method: 'charge_automatically',
      created: 1670536410,
      currency: 'bgn',
      current_period_end: 1673214810,
      current_period_start: 1670536410,
      customer: 'cus_MwlZM4frLL8pT8',
      days_until_due: null,
      default_payment_method: null,
      default_source: null,
      default_tax_rates: [],
      description: null,
      discount: null,
      ended_at: null,
      items: {
        object: 'list',
        data: [
          {
            id: 'si_MwlZCyuMDILdU7',
            object: 'subscription_item',
            billing_thresholds: null,
            created: 1670536411,
            metadata: {},
            plan: {
              id: 'price_1MCs1HFIrMXL5nkaoJsUSJKG',
              object: 'plan',
              active: false,
              aggregate_usage: null,
              amount: 1872,
              amount_decimal: '1872',
              billing_scheme: 'per_unit',
              created: 1670536363,
              currency: 'bgn',
              interval: 'month',
              interval_count: 1,
              livemode: false,
              metadata: {},
              nickname: null,
              product: 'prod_MwYEGRSdsnet4h',
              tiers_mode: null,
              transform_usage: null,
              trial_period_days: null,
              usage_type: 'licensed',
            },
            price: {
              id: 'price_1MCs1HFIrMXL5nkaoJsUSJKG',
              object: 'price',
              active: false,
              billing_scheme: 'per_unit',
              created: 1670536363,
              currency: 'bgn',
              custom_unit_amount: null,
              livemode: false,
              lookup_key: null,
              metadata: {},
              nickname: null,
              product: 'prod_MwYEGRSdsnet4h',
              recurring: {
                aggregate_usage: null,
                interval: 'month',
                interval_count: 1,
                trial_period_days: null,
                usage_type: 'licensed',
              },
              tax_behavior: 'unspecified',
              tiers_mode: null,
              transform_quantity: null,
              type: 'recurring',
              unit_amount: 1872,
              unit_amount_decimal: '1872',
            },
            quantity: 1,
            subscription: 'sub_1MCs22FIrMXL5nkaztW6rLaD',
            tax_rates: [],
          },
        ],
        has_more: false,
        total_count: 1,
        url: '/v1/subscription_items?subscription=sub_1MCs22FIrMXL5nkaztW6rLaD',
      },
      latest_invoice: 'in_1MCs22FIrMXL5nkaXZpWAd4Y',
      livemode: false,
      metadata: {
        campaignId: '1f42761b-85df-4b37-942d-350fd5f8ce7a',
        personId: '81a1feb2-baa0-4e40-8e34-f15d86196114',
      },
      next_pending_invoice_item_invoice: null,
      on_behalf_of: null,
      pause_collection: null,
      payment_settings: {
        payment_method_options: null,
        payment_method_types: null,
        save_default_payment_method: 'off',
      },
      pending_invoice_item_interval: null,
      pending_setup_intent: null,
      pending_update: null,
      plan: {
        id: 'price_1MCs1HFIrMXL5nkaoJsUSJKG',
        object: 'plan',
        active: false,
        aggregate_usage: null,
        amount: 1872,
        amount_decimal: '1872',
        billing_scheme: 'per_unit',
        created: 1670536363,
        currency: 'bgn',
        interval: 'month',
        interval_count: 1,
        livemode: false,
        metadata: {},
        nickname: null,
        product: 'prod_MwYEGRSdsnet4h',
        tiers_mode: null,
        transform_usage: null,
        trial_period_days: null,
        usage_type: 'licensed',
      },
      quantity: 1,
      schedule: null,
      start_date: 1670536410,
      status: 'incomplete',
      test_clock: null,
      transfer_data: null,
      trial_end: null,
      trial_start: null,
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_euTMPhi62hzvTc',
    idempotency_key: '5d2583ec-70eb-4df5-8fb8-2f8db1af5e7e',
  },
  type: 'customer.subscription.created',
}

export const mockedRecurringDonation: RecurringDonation = {
  id: 'sub_1MCs22FIrMXL5nkaztW6rLaD',
  amount: 1872,
  currency: 'BGN',
  status: 'incomplete',
  vaultId: 'cus_Mwl123',
  personId: '81a1feb2-baa0-4e40-8e34-f15d86196114',
  extCustomerId: 'cus_Mwl321',
  extSubscriptionId: 'sub_1MCs22FIrMXL5nkaztW6rLaD',
  createdAt: Date(),
}

export const mockInvoicePaidEvent: Stripe.Event = {
  id: 'evt_1MDz4SFIrMXL5nkawzOfj5Uh',
  object: 'event',
  api_version: '2022-08-01',
  created: 1670801796,
  data: {
    object: {
      id: 'in_1MCtcTFIrMXL5nkawpHsj9HJ',
      object: 'invoice',
      account_country: 'BG',
      account_name: 'Slavcho Ivanov',
      account_tax_ids: null,
      amount_due: 3600,
      amount_paid: 3600,
      amount_remaining: 0,
      application: null,
      application_fee_amount: null,
      attempt_count: 1,
      attempted: true,
      auto_advance: false,
      automatic_tax: {
        enabled: false,
        status: null,
      },
      billing_reason: 'subscription_cycle',
      charge: 'ch_3MDz4QFIrMXL5nka1Zi5PVwz',
      collection_method: 'charge_automatically',
      created: 1670542513,
      currency: 'bgn',
      custom_fields: null,
      customer: 'cus_MwPvuQLiTQnWnF',
      customer_address: {
        city: null,
        country: 'BG',
        line1: null,
        line2: null,
        postal_code: null,
        state: null,
      },
      customer_email: 'slavcho@gmail.com',
      customer_name: 'Slavcho Ivanov',
      customer_phone: null,
      customer_shipping: null,
      customer_tax_exempt: 'none',
      customer_tax_ids: [],
      default_payment_method: null,
      default_source: null,
      default_tax_rates: [],
      description: null,
      discount: null,
      discounts: [],
      due_date: null,
      ending_balance: 0,
      footer: null,
      from_invoice: null,
      hosted_invoice_url:
        'https://invoice.stripe.com/i/acct_1M4oT2FIrMXL5nka/test_YWNjdF8xTTRvVDJGSXJNWEw1bmthLF9Nd25DemxCUXVEYkkxOFJOYVJoc05UaXpKMllWbDZ1LDYxMzQyNTk20200dncvVMtf?s=ap',
      invoice_pdf:
        'https://pay.stripe.com/invoice/acct_1M4oT2FIrMXL5nka/test_YWNjdF8xTTRvVDJGSXJNWEw1bmthLF9Nd25DemxCUXVEYkkxOFJOYVJoc05UaXpKMllWbDZ1LDYxMzQyNTk20200dncvVMtf/pdf?s=ap',
      last_finalization_error: null,
      latest_revision: null,
      lines: {
        object: 'list',
        data: [
          {
            id: 'il_1MCtcTFIrMXL5nka1tYt2eLx',
            object: 'line_item',
            amount: 3600,
            amount_excluding_tax: 3600,
            currency: 'bgn',
            description: '1 × Дарение (at 36.00 лв / day)',
            discount_amounts: [],
            discountable: true,
            discounts: [],
            livemode: false,
            metadata: {
              campaignId: '1f42761b-85df-4b37-942d-350fd5f8ce7a',
              personId: '81a1feb2-baa0-4e40-8e34-f15d86196114',
            },
            period: {
              end: 1670628703,
              start: 1670542303,
            },
            plan: {
              id: 'price_1M742cFIrMXL5nkaVEsRHd5d',
              object: 'plan',
              active: true,
              aggregate_usage: null,
              amount: 3600,
              amount_decimal: '3600',
              billing_scheme: 'per_unit',
              created: 1669152606,
              currency: 'bgn',
              interval: 'day',
              interval_count: 1,
              livemode: false,
              metadata: {},
              nickname: null,
              product: 'prod_MoVOW2Twws6VTa',
              tiers_mode: null,
              transform_usage: null,
              trial_period_days: null,
              usage_type: 'licensed',
            },
            price: {
              id: 'price_1M742cFIrMXL5nkaVEsRHd5d',
              object: 'price',
              active: true,
              billing_scheme: 'per_unit',
              created: 1669152606,
              currency: 'bgn',
              custom_unit_amount: null,
              livemode: false,
              lookup_key: null,
              metadata: {},
              nickname: null,
              product: 'prod_MoVOW2Twws6VTa',
              recurring: {
                aggregate_usage: null,
                interval: 'day',
                interval_count: 1,
                trial_period_days: null,
                usage_type: 'licensed',
              },
              tax_behavior: 'unspecified',
              tiers_mode: null,
              transform_quantity: null,
              type: 'recurring',
              unit_amount: 3600,
              unit_amount_decimal: '3600',
            },
            proration: false,
            proration_details: {
              credited_items: null,
            },
            quantity: 1,
            subscription: 'sub_1MCX5XFIrMXL5nkaLZzkR1hy',
            subscription_item: 'si_MwPvF9yjX6mCfL',
            tax_amounts: [],
            tax_rates: [],
            type: 'subscription',
            unit_amount_excluding_tax: '3600',
          },
        ],
        has_more: false,
        total_count: 1,
        url: '/v1/invoices/in_1MCtcTFIrMXL5nkawpHsj9HJ/lines',
      },
      livemode: false,
      metadata: {},
      next_payment_attempt: null,
      number: 'C8E2E3F5-0060',
      on_behalf_of: null,
      paid: true,
      paid_out_of_band: false,
      payment_intent: 'pi_3MDz4QFIrMXL5nka1dYw1rgc',
      payment_settings: {
        default_mandate: null,
        payment_method_options: null,
        payment_method_types: null,
      },
      period_end: 1670542303,
      period_start: 1670455903,
      post_payment_credit_notes_amount: 0,
      pre_payment_credit_notes_amount: 0,
      quote: null,
      receipt_number: null,
      rendering_options: null,
      starting_balance: 0,
      statement_descriptor: null,
      status: 'paid',
      status_transitions: {
        finalized_at: 1670801793,
        marked_uncollectible_at: null,
        paid_at: 1670801793,
        voided_at: null,
      },
      subscription: 'sub_1MCX5XFIrMXL5nkaLZzkR1hy',
      subtotal: 3600,
      subtotal_excluding_tax: 3600,
      tax: null,
      test_clock: null,
      total: 3600,
      total_discount_amounts: [],
      total_excluding_tax: 3600,
      total_tax_amounts: [],
      transfer_data: null,
      webhooks_delivered_at: null,
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null,
  },
  type: 'invoice.paid',
}
