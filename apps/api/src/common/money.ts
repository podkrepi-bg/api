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
