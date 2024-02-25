import { PaymentStatus } from '@prisma/client'

const initial: PaymentStatus[] = [PaymentStatus.initial]
const changeable: PaymentStatus[] = [
  PaymentStatus.incomplete,
  PaymentStatus.paymentRequested,
  PaymentStatus.waiting,
  PaymentStatus.declined,
  PaymentStatus.guaranteed,
]
const final: PaymentStatus[] = [
  PaymentStatus.succeeded,
  PaymentStatus.cancelled,
  PaymentStatus.deleted,
  PaymentStatus.invalid,
  PaymentStatus.refund,
]

function isInitial(status: PaymentStatus) {
  return initial.includes(status)
}

function isChangeable(status: PaymentStatus) {
  return changeable.includes(status)
}

function isFinal(status: PaymentStatus) {
  return final.includes(status)
}

function isRefundable(oldStatus: PaymentStatus, newStatus: PaymentStatus) {
  return oldStatus === PaymentStatus.succeeded && newStatus === PaymentStatus.refund
}

/**
 * The function returns the allowed previous status that can be changed/updated by the incoming donation event
 * @param newStatus the incoming status of the payment event
 * @returns allowed previous status that can be changed by the event
 */
export function shouldAllowStatusChange(
  oldStatus: PaymentStatus,
  newStatus: PaymentStatus,
): boolean {
  if (oldStatus === newStatus || isRefundable(oldStatus, newStatus)) {
    return true
  }

  if (isFinal(oldStatus) || isInitial(newStatus)) {
    return false
  }

  if (
    (isFinal(newStatus) || isChangeable(newStatus)) &&
    (isChangeable(oldStatus) || isInitial(oldStatus))
  ) {
    return true
  }

  throw new Error(`Unhandled donation status change from ${oldStatus} to ${newStatus}`)
}
