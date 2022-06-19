import { CreateManyBankPaymentsDto } from '../../donations/dto/create-many-bank-payments.dto'

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const parseString = require('xml2js').parseString

export function parseBankTransactionsFile(
  fileBuffer,
): { payment: CreateManyBankPaymentsDto; paymentRef: string }[] {
  const accountMovements: { payment: CreateManyBankPaymentsDto; paymentRef: string }[] = []
  parseString(fileBuffer, function (err, items) {
    for (const item in items) {
      for (const movement in items[item].AccountMovement) {
        if (items[item].AccountMovement[movement].MovementType[0] === 'Credit') {
          const payment = new CreateManyBankPaymentsDto()
          const paymentRef = items[item].AccountMovement[movement].Reason[0]
          payment.amount = Number(items[item].AccountMovement[movement].Amount[0]) * 100
          payment.currency = items[item].AccountMovement[movement].CCY[0]
          payment.extCustomerId = items[item].AccountMovement[movement].Account[0].BankClientID[0]
          payment.extPaymentIntentId = items[item].AccountMovement[movement].DocumentReference[0]
          accountMovements.push({ payment, paymentRef })
        }
      }
    }
  })
  return accountMovements
}