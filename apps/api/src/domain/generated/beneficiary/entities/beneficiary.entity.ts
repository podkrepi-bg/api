
import {Prisma,BeneficiaryType,PersonRelation} from '@prisma/client'
import {City} from '../../city/entities/city.entity'
import {Coordinator} from '../../coordinator/entities/coordinator.entity'
import {Person} from '../../person/entities/person.entity'
import {Company} from '../../company/entities/company.entity'
import {Campaign} from '../../campaign/entities/campaign.entity'


export class Beneficiary {
  id: string ;
type: BeneficiaryType ;
personId: string  | null;
companyId: string  | null;
coordinatorId: string ;
countryCode: string ;
cityId: string ;
description: string  | null;
publicData: Prisma.JsonValue  | null;
privateData: Prisma.JsonValue  | null;
createdAt: Date ;
updatedAt: Date  | null;
coordinatorRelation: PersonRelation ;
city?: City ;
coordinator?: Coordinator ;
person?: Person  | null;
company?: Company  | null;
campaigns?: Campaign[] ;
}
