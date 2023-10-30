import crypto from 'crypto'

export function affiliateCodeGenerator(affiliateId: string) {
  const uniqueHash = crypto
    .createHash('sha256')
    .update(affiliateId + process.env.JWT_SECRET_KEY + new Date())
    .digest('hex')
    .slice(0, 8)
  return 'af_' + uniqueHash
}
