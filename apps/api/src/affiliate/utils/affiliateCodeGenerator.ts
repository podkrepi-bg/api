import crypto from 'crypto'

export function affiliateCodeGenerator(affiliateId: string) {
  const uniqueHash = crypto.createHash('sha256').update(affiliateId).digest('hex').slice(0, 5)
  return 'af_' + uniqueHash
}
