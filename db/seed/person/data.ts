import { Person } from '@prisma/client'
import { personFactory } from './factory'

/**
 * List with pre-defined default users (Persons)
 */

export const adminUser: Person = personFactory.build({
  firstName: 'Admin',
  lastName: 'Dev',
  email: 'admin@podkrepi.bg',
  keycloakId: '6892fe15-d116-4aec-a417-82ebd990b63a',
})

export const coordinatorUser: Person = personFactory.build({
  firstName: 'Coordinator',
  lastName: 'Dev',
  email: 'coordinator@podkrepi.bg',
  keycloakId: '81d93c73-db28-4402-8ec0-a5b1709ed1cf',
})

export const giverUser: Person = personFactory.build({
  firstName: 'Giver',
  lastName: 'Dev',
  email: 'giver@podkrepi.bg',
  keycloakId: '190486ff-7f0e-4e28-94ca-b624726b5389',
})

export const receiverUser: Person = personFactory.build({
  firstName: 'Receiver',
  lastName: 'Dev',
  email: 'receiver@podkrepi.bg',
  keycloakId: '6c688460-73ec-414c-8252-986b0658002b',
})

export const reviewerUser: Person = personFactory.build({
  firstName: 'Reviewer',
  lastName: 'Dev',
  email: 'reviewer@podkrepi.bg',
  keycloakId: '36bec201-b203-46ad-a8c3-43a0128c73e1',
})
