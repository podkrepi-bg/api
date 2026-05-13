import { SetMetadata } from '@nestjs/common'

export const PAYMENT_STEP_KEY = 'paymentStep'
export const PaymentStep = (step: string) => SetMetadata(PAYMENT_STEP_KEY, step)
