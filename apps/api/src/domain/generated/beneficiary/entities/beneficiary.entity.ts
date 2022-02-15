
import {Prisma,BeneficiaryType} from '@prisma/client'


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
}
