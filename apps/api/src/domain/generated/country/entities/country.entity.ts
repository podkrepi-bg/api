
import {City} from '../../city/entities/city.entity'


export class Country {
  id: string ;
name: string ;
countryCode: string ;
cities?: City[] ;
}
