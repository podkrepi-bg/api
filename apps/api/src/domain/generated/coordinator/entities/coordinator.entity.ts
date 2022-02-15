
import {Person} from '../../person/entities/person.entity'
import {Campaign} from '../../campaign/entities/campaign.entity'


export class Coordinator {
  id: string ;
personId: string ;
createdAt: Date ;
updatedAt: Date  | null;
person?: Person ;
campaigns?: Campaign[] ;
}
