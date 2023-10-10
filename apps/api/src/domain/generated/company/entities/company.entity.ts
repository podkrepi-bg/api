
import {Beneficiary} from '../../beneficiary/entities/beneficiary.entity'
import {Campaign} from '../../campaign/entities/campaign.entity'
import {Person} from '../../person/entities/person.entity'
import {Affiliate} from '../../affiliate/entities/affiliate.entity'


export class Company {
  id: string ;
companyName: string ;
companyNumber: string ;
legalPersonName: string  | null;
countryCode: string  | null;
cityId: string  | null;
personId: string  | null;
createdAt: Date ;
updatedAt: Date  | null;
beneficiaries?: Beneficiary[] ;
Campaign?: Campaign[] ;
person?: Person  | null;
affiliate?: Affiliate  | null;
}
