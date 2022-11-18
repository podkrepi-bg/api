
import {Prisma,BeneficiaryType,PersonRelation} from '@prisma/client'
import {City} from '../../city/entities/city.entity'
import {Company} from '../../company/entities/company.entity'
import {Coordinator} from '../../coordinator/entities/coordinator.entity'
import {Organizer} from '../../organizer/entities/organizer.entity'
import {Person} from '../../person/entities/person.entity'
import {Campaign} from '../../campaign/entities/campaign.entity'


export class Beneficiary {
  id: string ;
type: BeneficiaryType ;
personId: string  | null;
coordinatorId: string  | null;
countryCode: string ;
cityId: string ;
createdAt: Date ;
updatedAt: Date  | null;
coordinatorRelation: PersonRelation  | null;
description: string  | null;
privateData: Prisma.JsonValue  | null;
publicData: Prisma.JsonValue  | null;
companyId: string  | null;
organizerId: string  | null;
organizerRelation: PersonRelation  | null;
city?: City ;
company?: Company  | null;
coordinator?: Coordinator  | null;
organizer?: Organizer  | null;
person?: Person  | null;
campaigns?: Campaign[] ;
}
