
import {Person} from '../../person/entities/person.entity'
import {Beneficiary} from '../../beneficiary/entities/beneficiary.entity'
import {Campaign} from '../../campaign/entities/campaign.entity'


export class Coordinator {
  id: string ;
personId: string ;
createdAt: Date ;
updatedAt: Date  | null;
person?: Person ;
beneficiaries?: Beneficiary[] ;
campaigns?: Campaign[] ;
}
