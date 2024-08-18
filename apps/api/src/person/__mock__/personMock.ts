import { Person } from '@prisma/client'

export const personMock: Person = {
  id: 'personId',
  firstName: 'John',
  lastName: 'Doe',
  keycloakId: 'some-id',
  email: 'user@email.com',
  emailConfirmed: false,
  companyId: null,
  phone: null,
  picture: null,
  createdAt: new Date('2021-10-07T13:38:11.097Z'),
  updatedAt: new Date('2021-10-07T13:38:11.097Z'),
  newsletter: true,
  address: null,
  birthday: null,
  personalNumber: null,
  stripeCustomerId: null,
  profileEnabled: true,
  helpUsImprove: false,
}
