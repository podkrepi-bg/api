import { Logger } from '@nestjs/common'
import { CreateManyBankPaymentsDto } from '../../donations/dto/create-many-bank-payments.dto'
import { toMoney } from '../../common/money'
import { DateTime } from 'luxon'

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const parseString = require('xml2js').parseString

const regexPaymentRef = /\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/g
const cashDepositBGString = 'Вноска на каса'

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
          payment.amount = toMoney(items[item].AccountMovement[movement].Amount[0])
          payment.currency = items[item].AccountMovement[movement].CCY[0]
          payment.extCustomerId = items[item].AccountMovement[movement].OppositeSideAccount[0]
          payment.extPaymentIntentId = items[item].AccountMovement[movement].DocumentReference[0]
          payment.createdAt = new Date(
            items[item].AccountMovement[movement].PaymentDateTime[0].concat(
              getEasternEuropeRegionTimeZone(),
            ),
          )

          const movementFunctionalType =
            items[item].AccountMovement[movement].MovementFunctionalType[0]
          const billingName = items[item].AccountMovement[movement].OppositeSideName[0]
          if (isBillingNamePresent(movementFunctionalType, billingName)) {
            payment.billingName = billingName
          }

          const matchedRef = paymentRef.replace(/[ _]+/g, '-').match(regexPaymentRef)
          if (matchedRef) {
            accountMovements.push({ payment, paymentRef: matchedRef[0] })
          } else {
            Logger.warn('cannot recognize paymentRef from NarrativeI02 field: ' + paymentRef)
          }
        }
      }
    }
  })
  return accountMovements
}

function isBillingNamePresent(movementFunctionalType: string, billingName: string) {
  return !(
    movementFunctionalType === cashDepositBGString &&
    billingName['$'] !== undefined &&
    billingName['$']['nil']
  )
}

function getEasternEuropeRegionTimeZone(): string {
  const timeZoneOffsetSliceFrom = -6
  const dateTime = DateTime.local().setZone('Europe/Sofia').toString()
  return dateTime.slice(timeZoneOffsetSliceFrom)
}
