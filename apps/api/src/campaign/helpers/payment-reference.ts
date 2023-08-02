import { customAlphabet as paymentReferenceGenerator } from 'nanoid'

const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ' //Exclude 0, 1, O, I, L
const nanoid = paymentReferenceGenerator(alphabet, 12)

export function getPaymentReference(): string {
  let id: string = nanoid() //=> "NY5PKVO4DNBZ"
  //add dashes for readability "NY5P-KVO4-DNBZ"
  id = id.slice(0, 4) + '-' + id.slice(4, 8) + '-' + id.slice(8, 12)
  return id
}
