
import {Prisma} from '@prisma/client'




export class CreateBeneficiaryDto {
  type: string;
countryCode: string;
description?: string;
publicData?: Prisma.InputJsonValue;
privateData?: Prisma.InputJsonValue;
}
