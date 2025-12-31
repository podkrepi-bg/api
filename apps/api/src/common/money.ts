/**
 * Fixed exchange rate for BGN to EUR conversion
 * 1 EUR = 1.95583 BGN (Bulgarian Lev is pegged to Euro)
 */
export const BGN_TO_EUR_RATE = 1.95583

/**
 * The function corrects parsing problems like "160.2" to be parsed as float 160.1999999
 * The internal money format is in cents, so the parsed amount is multiplied by 100.
 * For the example of "160.2" it returns an integer of 16020
 * @param amount from external sources
 * @returns integer amount in cents
 */
export function toMoney(amount: number | string): number {
  const value = Number(amount)
  return Math.round((value + Number.EPSILON) * 100)
}

/**
 * Converts EUR amount to BGN amount
 * @param eurAmount - Amount in EUR (can be in cents or regular units)
 * @param isInCents - Whether the input amount is in cents (default: false)
 * @returns Amount in BGN
 */
export function eurToBgn(eurAmount: number, isInCents = false): number {
  const amountInEur = isInCents ? eurAmount / 100 : eurAmount
  return amountInEur * BGN_TO_EUR_RATE
}
