
import {BootcampStatus} from '@prisma/client'


export class Bootcamp {
  id: string ;
firstName: string ;
lastName: string ;
status: BootcampStatus ;
title: string ;
email: string ;
message: string ;
startDate: Date ;
endDate: Date  | null;
}
