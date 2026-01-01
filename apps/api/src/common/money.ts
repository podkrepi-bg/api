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

/**
 * Converts BGN amount to EUR amount using the fixed exchange rate
 * @param bgnAmount - Amount in BGN (can be in cents or regular units)
 * @param isInCents - Whether the input amount is in cents (default: false)
 * @returns Amount in EUR (in the same unit as input - cents or regular)
 */
export function bgnToEur(bgnAmount: number, isInCents = false): number {
  // When converting BGN to EUR, we divide by the rate since 1 EUR = 1.95583 BGN
  if (isInCents) {
    // For cents, we need to maintain precision and round
    return Math.round(bgnAmount / BGN_TO_EUR_RATE)
  }
  return bgnAmount / BGN_TO_EUR_RATE
}

/**
 * Gets the fixed exchange rate for a currency pair
 * Returns undefined if no fixed rate exists for the pair
 * @param sourceCurrency - Source currency code (e.g., 'BGN')
 * @param targetCurrency - Target currency code (e.g., 'EUR')
 * @returns The exchange rate to multiply by, or undefined if no fixed rate exists
 */
export function getFixedExchangeRate(
  sourceCurrency: string,
  targetCurrency: string,
): number | undefined {
  const rateKey = `${sourceCurrency}_${targetCurrency}`
  const fixedRates: Record<string, number> = {
    BGN_EUR: 1 / BGN_TO_EUR_RATE, // ~0.5113 (1 BGN = 0.5113 EUR)
    EUR_BGN: BGN_TO_EUR_RATE, // 1.95583 (1 EUR = 1.95583 BGN)
  }
  return fixedRates[rateKey]
}
