import { BGN_TO_EUR_RATE, toMoney, eurToBgn, bgnToEur, getFixedExchangeRate } from './money'

describe('money utilities', () => {
  describe('BGN_TO_EUR_RATE', () => {
    it('should be the fixed BGN to EUR rate', () => {
      expect(BGN_TO_EUR_RATE).toBe(1.95583)
    })
  })

  describe('toMoney', () => {
    it('should convert number to cents', () => {
      expect(toMoney(160.2)).toBe(16020)
    })

    it('should convert string to cents', () => {
      expect(toMoney('160.2')).toBe(16020)
    })

    it('should handle whole numbers', () => {
      expect(toMoney(100)).toBe(10000)
    })

    it('should handle zero', () => {
      expect(toMoney(0)).toBe(0)
    })

    it('should round floating point precision issues', () => {
      // 0.1 + 0.2 = 0.30000000000000004 in JavaScript
      expect(toMoney(0.1 + 0.2)).toBe(30)
    })
  })

  describe('eurToBgn', () => {
    it('should convert EUR to BGN using the fixed rate', () => {
      const result = eurToBgn(100)
      expect(result).toBeCloseTo(195.583, 3)
    })

    it('should handle amount in cents', () => {
      // 10000 cents = 100 EUR -> should give BGN amount
      const result = eurToBgn(10000, true)
      expect(result).toBeCloseTo(195.583, 3)
    })

    it('should handle zero', () => {
      expect(eurToBgn(0)).toBe(0)
    })

    it('should handle decimal amounts', () => {
      const result = eurToBgn(50.5)
      expect(result).toBeCloseTo(98.769415, 3)
    })
  })

  describe('bgnToEur', () => {
    it('should convert BGN to EUR using the fixed rate', () => {
      const result = bgnToEur(195.583)
      expect(result).toBeCloseTo(100, 3)
    })

    it('should handle amount in cents and round result', () => {
      // 19558 stotinki (BGN cents) should convert to EUR cents
      const result = bgnToEur(19558, true)
      // 19558 / 1.95583 ≈ 9999.95 -> rounds to 10000
      expect(result).toBe(10000)
    })

    it('should handle zero', () => {
      expect(bgnToEur(0)).toBe(0)
    })

    it('should handle decimal amounts', () => {
      const result = bgnToEur(100)
      expect(result).toBeCloseTo(51.129, 3)
    })

    it('should properly round cents conversion', () => {
      // Test that 1000 BGN cents converts correctly
      const result = bgnToEur(1000, true)
      // 1000 / 1.95583 ≈ 511.29 -> rounds to 511
      expect(result).toBe(511)
    })

    it('should be the inverse of eurToBgn', () => {
      const originalEur = 100
      const bgn = eurToBgn(originalEur)
      const backToEur = bgnToEur(bgn)
      expect(backToEur).toBeCloseTo(originalEur, 10)
    })
  })

  describe('getFixedExchangeRate', () => {
    it('should return the BGN to EUR rate', () => {
      const rate = getFixedExchangeRate('BGN', 'EUR')
      expect(rate).toBeDefined()
      expect(rate).toBeCloseTo(1 / BGN_TO_EUR_RATE, 10)
      expect(rate).toBeCloseTo(0.5113, 4)
    })

    it('should return the EUR to BGN rate', () => {
      const rate = getFixedExchangeRate('EUR', 'BGN')
      expect(rate).toBeDefined()
      expect(rate).toBe(BGN_TO_EUR_RATE)
    })

    it('should return undefined for unknown currency pairs', () => {
      expect(getFixedExchangeRate('USD', 'EUR')).toBeUndefined()
      expect(getFixedExchangeRate('GBP', 'BGN')).toBeUndefined()
      expect(getFixedExchangeRate('BGN', 'USD')).toBeUndefined()
    })

    it('should return undefined for same currency', () => {
      expect(getFixedExchangeRate('EUR', 'EUR')).toBeUndefined()
      expect(getFixedExchangeRate('BGN', 'BGN')).toBeUndefined()
    })

    it('should be case sensitive', () => {
      expect(getFixedExchangeRate('bgn', 'eur')).toBeUndefined()
      expect(getFixedExchangeRate('Bgn', 'Eur')).toBeUndefined()
    })

    it('BGN_EUR rate should allow correct conversion', () => {
      const rate = getFixedExchangeRate('BGN', 'EUR')!
      const bgnAmount = 195.583
      const eurAmount = bgnAmount * rate
      expect(eurAmount).toBeCloseTo(100, 3)
    })

    it('EUR_BGN rate should allow correct conversion', () => {
      const rate = getFixedExchangeRate('EUR', 'BGN')!
      const eurAmount = 100
      const bgnAmount = eurAmount * rate
      expect(bgnAmount).toBeCloseTo(195.583, 3)
    })
  })
})
