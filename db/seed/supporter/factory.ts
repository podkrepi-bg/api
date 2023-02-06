import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Supporter } from '@prisma/client'

export const supporterFactory = Factory.define<Supporter>(({ associations }) => ({
  id: faker.datatype.uuid(),
  personId: associations.personId || faker.datatype.uuid(),
  comment: faker.lorem.paragraph(),
  associationMember: faker.datatype.boolean(),
  benefactorCampaign: faker.datatype.boolean(),
  benefactorPlatform: faker.datatype.boolean(),
  companyOtherText: faker.lorem.lines(1),
  companySponsor: faker.datatype.boolean(),
  companyVolunteer: faker.datatype.boolean(),
  partnerBussiness: faker.datatype.boolean(),
  partnerNpo: faker.datatype.boolean(),
  partnerOtherText: faker.lorem.lines(1),
  roleAssociationMember: faker.datatype.boolean(),
  roleBenefactor: faker.datatype.boolean(),
  roleCompany: faker.datatype.boolean(),
  rolePartner: faker.datatype.boolean(),
  roleVolunteer: faker.datatype.boolean(),
  volunteerBackend: faker.datatype.boolean(),
  volunteerDesigner: faker.datatype.boolean(),
  volunteerDevOps: faker.datatype.boolean(),
  volunteerFinancesAndAccounts: faker.datatype.boolean(),
  volunteerFrontend: faker.datatype.boolean(),
  volunteerLawyer: faker.datatype.boolean(),
  volunteerMarketing: faker.datatype.boolean(),
  volunteerProjectManager: faker.datatype.boolean(),
  volunteerQa: faker.datatype.boolean(),
  volunteerSecurity: faker.datatype.boolean(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
}))
