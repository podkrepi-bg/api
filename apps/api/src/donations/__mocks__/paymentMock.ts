import { Currency, DonationType, PaymentProvider, PaymentStatus } from '@prisma/client'
import { PaymentWithDonation } from '../types/donation'
import { DonationWithPerson } from '../types/donation'
import { personMock } from '../../person/__mock__/personMock'

export const mockDonation: DonationWithPerson = {
  id: '1234',
  paymentId: '123',
  type: DonationType.donation,
  amount: 10,
  targetVaultId: 'vault-1',
  createdAt: new Date('2022-01-01'),
  updatedAt: new Date('2022-01-02'),
  personId: '1',
  person: personMock,
}

//Mock donation to different vault
const mockDonationWithDiffVaultId: DonationWithPerson = {
  ...mockDonation,
  targetVaultId: 'vault-2',
}

//Mock donation to same vault as mockDonation, but different amount
const mockDonationWithDiffAmount: DonationWithPerson = { ...mockDonation, amount: 50 }

export const mockPayment: PaymentWithDonation = {
  id: '123',
  provider: PaymentProvider.bank,
  currency: Currency.BGN,
  type: 'single',
  status: PaymentStatus.initial,
  amount: 10,
  affiliateId: null,
  extCustomerId: 'hahaha',
  extPaymentIntentId: 'pm1',
  extPaymentMethodId: 'bank',
  billingEmail: 'test@podkrepi.bg',
  billingName: 'Test',
  chargedAmount: 10.5,
  createdAt: new Date('2022-01-01'),
  updatedAt: new Date('2022-01-02'),
  donations: [mockDonation, mockDonationWithDiffVaultId, mockDonationWithDiffAmount],
}

export const mockSucceededPayment: PaymentWithDonation = {
  ...mockPayment,
  status: PaymentStatus.succeeded,
}
export const mockGuaranteedPayment: PaymentWithDonation = {
  ...mockPayment,
  status: PaymentStatus.guaranteed,
}
export const mockCancelledPayment: PaymentWithDonation = {
  ...mockPayment,
  status: PaymentStatus.cancelled,
}
