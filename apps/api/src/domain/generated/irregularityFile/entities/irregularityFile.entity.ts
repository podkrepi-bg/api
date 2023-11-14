
import {Irregularity} from '../../irregularity/entities/irregularity.entity'
import {Person} from '../../person/entities/person.entity'


export class IrregularityFile {
  id: string ;
filename: string ;
mimetype: string ;
irregularityId: string ;
uploaderId: string ;
irregularity?: Irregularity ;
uploadedBy?: Person ;
}
