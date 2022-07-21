import { DonationStatus } from '@prisma/client'

/**
 * The function returns the allowed previous status that can be changed/updated by the incoming donation event
 * @param newStatus the incoming status of the payment event
 * @returns allowed previous status that can be changed by the event
 */
export function getAllowedPreviousStatus(newStatus: DonationStatus): DonationStatus | undefined {
  switch (newStatus) {
    case DonationStatus.waiting: {
      return DonationStatus.initial
    }
    case DonationStatus.succeeded: {
      return DonationStatus.waiting
    }
    case DonationStatus.cancelled: {
      return DonationStatus.waiting
    }
  }
  return undefined
}
