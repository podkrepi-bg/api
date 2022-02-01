
import {Person} from '../../person/entities/person.entity'


export class InfoRequest {
  id: string ;
personId: string ;
message: string ;
createdAt: Date ;
updatedAt: Date  | null;
deletedAt: Date  | null;
person?: Person ;
}
