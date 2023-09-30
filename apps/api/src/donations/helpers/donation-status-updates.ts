import { DonationStatus } from '@prisma/client'

const initial: DonationStatus[] = [DonationStatus.initial]
const changeable: DonationStatus[] = [
  DonationStatus.incomplete,
  DonationStatus.paymentRequested,
  DonationStatus.waiting,
]
const final: DonationStatus[] = [
  DonationStatus.succeeded,
  DonationStatus.cancelled,
  DonationStatus.deleted,
  DonationStatus.declined,
  DonationStatus.invalid,
  DonationStatus.refund,
]

function isInitial(status: DonationStatus) {
  return initial.includes(status)
}

function isChangeable(status: DonationStatus) {
  return changeable.includes(status)
}

function isFinal(status: DonationStatus) {
  return final.includes(status)
}

function isRefundable(oldStatus: DonationStatus, newStatus: DonationStatus) {
  return oldStatus === DonationStatus.succeeded && newStatus === DonationStatus.refund
}

/**
 * The function returns the allowed previous status that can be changed/updated by the incoming donation event
 * @param newStatus the incoming status of the payment event
 * @returns allowed previous status that can be changed by the event
 */
export function shouldAllowStatusChange(
  oldStatus: DonationStatus,
  newStatus: DonationStatus,
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
