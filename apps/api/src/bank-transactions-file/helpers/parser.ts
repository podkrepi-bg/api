import { Logger } from '@nestjs/common'
import { CreateManyBankPaymentsDto } from '../../donations/dto/create-many-bank-payments.dto'

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const parseString = require('xml2js').parseString

const regexPaymentRef = /\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/g

export function parseBankTransactionsFile(
  fileBuffer,
): { payment: CreateManyBankPaymentsDto; paymentRef: string }[] {
  const accountMovements: { payment: CreateManyBankPaymentsDto; paymentRef: string }[] = []
  parseString(fileBuffer, function (err, items) {
    for (const item in items) {
      for (const movement in items[item].AccountMovement) {
        if (
          items[item].AccountMovement[movement].MovementType[0] === 'Credit' &&
          items[item].AccountMovement[movement].Status[0].Context[0] === 'success'
        ) {
          const payment = new CreateManyBankPaymentsDto()
          const paymentRef = items[item].AccountMovement[movement].NarrativeI02[0]
          payment.amount = Number(items[item].AccountMovement[movement].Amount[0]) * 100
          payment.currency = items[item].AccountMovement[movement].CCY[0]
          payment.extCustomerId = items[item].AccountMovement[movement].OppositeSideAccount[0]
          payment.extPaymentIntentId = items[item].AccountMovement[movement].DocumentReference[0]
          payment.createdAt = new Date(items[item].AccountMovement[movement].PaymentDateTime[0])
          payment.billingName = items[item].AccountMovement[movement].OppositeSideName[0]

          const matchedRef = paymentRef.replace(/[ _]+/g, '-').match(regexPaymentRef)
          if (matchedRef) {
            accountMovements.push({ payment, paymentRef: matchedRef[0] })
          } else {
            Logger.warn('skipping record with paymentRef: ' + paymentRef)
          }

          Logger.log('ref: ' + paymentRef)
          Logger.log('Status:' + items[item].AccountMovement[movement].Status[0].Context[0])
        }
      }
    }
  })
  return accountMovements
}
