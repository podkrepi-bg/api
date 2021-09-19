import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function personSeed() {
  console.log('Persons seed')

  const insert = await prisma.person.createMany({
    data: [
      { firstName: 'Sofia', lastName: 'Vicheva', email: 'sofia@example.com', phone: '+359888000000', company: 'ABC', address: 'Stefan Karadja 5, Sofia', newsletter: true},
      { firstName: 'Vyara', lastName: 'Ivanova', email: 'v@example.com', phone: '+359888000000', company: 'ABC', address: 'Stefan Karadja 5, Sofia', newsletter: true},
      { firstName: 'Nadezhda', lastName: 'Petrova', email: 'n@example.com', phone: '+359888000000', company: 'HJI', address: 'Ivan Mihailov 1, Blagoevgrad', newsletter: true},
      { firstName: 'Lyubov', lastName: 'Petkova', email: 'l@example.com', phone: '+359888000000', company: 'KLM', address: 'Ivan Ivanov 15, Blagoevgrad', newsletter: true},
      { firstName: 'Petyr', lastName: 'Petrov', email: 'pesho@example.com', phone: '+359888000000', company: 'A very long company LLC', address: 'Dimityr Blagoev 9, Blagoevgrad', newsletter: true},
      { firstName: 'Ivan', lastName: 'Nikolov', email: 'i@example.com', phone: '+359888000000', company: 'Short company', address: 'Dimityr Blagoev 3, Petrich', newsletter: true},
      { firstName: 'Kiril', lastName: 'Velichkov', email: 'k@example.com', phone: '+359888000000', company: 'Be real', address: 'Dimityr Blagoev 3, Sandanski', newsletter: true},
      { firstName: 'Kostadin', lastName: 'Kostadinov', email: 'kotse@example.com', phone: '+359888000000', company: 'Be real 2', address: 'Dimityr Blagoev 3, Varna', newsletter: true},
    ],
    skipDuplicates: true,
  })
  console.log({ insert })
}
