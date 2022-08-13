import { Logger } from '@nestjs/common'
import { CreateManyBankPaymentsDto } from '../../donations/dto/create-many-bank-payments.dto'

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const parseString = require('xml2js').parseString

const uuidPaymentRefRegex = /\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/g
const slugPaymentRefRegex = /[*#]{1}(.*)[*#]{1}/g

export function parseBankTransactionsFile(
  fileBuffer,
): { payment: CreateManyBankPaymentsDto; paymentRef: string, refError?: string }[] {
  const accountMovements: { payment: CreateManyBankPaymentsDto; paymentRef: string, refError?: string }[] = []
  parseString(fileBuffer, function (err, items) {
    for (const item in items) {
      for (const movement in items[item].AccountMovement) {
        if (
          items[item].AccountMovement[movement].MovementType[0] === 'Credit' &&
          items[item].AccountMovement[movement].Status[0].Context[0] === 'success'
        ) {
          const payment = new CreateManyBankPaymentsDto()
          const paymentRef: string = items[item].AccountMovement[movement].NarrativeI02[0]
          payment.amount = Number(items[item].AccountMovement[movement].Amount[0]) * 100
          payment.currency = items[item].AccountMovement[movement].CCY[0]
          payment.extCustomerId = items[item].AccountMovement[movement].OppositeSideAccount[0]
          payment.extPaymentIntentId = items[item].AccountMovement[movement].DocumentReference[0]
          payment.createdAt = new Date(items[item].AccountMovement[movement].PaymentDateTime[0])
          payment.billingName = items[item].AccountMovement[movement].OppositeSideName[0]

          const matchedUUIDRef = paymentRef.replace(/[ _]+/g, '-').match(uuidPaymentRefRegex) // leaving it for backwards-compatibility
          const matchedSlugRef = paymentRef.match(slugPaymentRefRegex)
          let validRef = ""
          if (matchedUUIDRef) {
            validRef = matchedUUIDRef[0]
          } else if (matchedSlugRef) {
            validRef = matchedSlugRef[0]
          }

          if (validRef) {
            accountMovements.push({ payment, paymentRef: validRef })
          } else {
            accountMovements.push({ payment, paymentRef: paymentRef, refError: 'cannot recognize paymentRef' })
            Logger.warn('cannot recognize paymentRef from NarrativeI02 field: ' + paymentRef)
          }
        }
      }
    }
  })
  return accountMovements
}
