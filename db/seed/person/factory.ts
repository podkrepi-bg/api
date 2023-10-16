import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Person } from '@prisma/client'

export const personFactory = Factory.define<Person>(() => ({
  id: faker.datatype.uuid(),
  keycloakId: null,
  stripeCustomerId: null,
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  emailConfirmed: faker.datatype.boolean(),
  picture: faker.image.imageUrl(),
  phone: faker.phone.number('+359########'),
  personalNumber: faker.random.numeric(10),
  address: `${faker.address.street()}, ${faker.address.cityName()}`,
  birthday: faker.date.birthdate(),
  newsletter: faker.datatype.boolean(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}))
