
import {Country} from '../../country/entities/country.entity'


export class City {
  id: string ;
name: string ;
postalCode: number ;
countryId: string ;
countryCode?: Country ;
}
