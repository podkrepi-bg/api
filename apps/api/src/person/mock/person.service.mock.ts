import { PersonService } from '../person.service'

export const personServiceMock = {
  findOneByKeycloakId: jest.fn(() => ({ id: 'testPersonId' })),
}

export const PersonServiceMock = { provide: PersonService, useValue: personServiceMock }
