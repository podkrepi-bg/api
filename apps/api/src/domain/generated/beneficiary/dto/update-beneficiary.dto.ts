
import {Prisma} from '@prisma/client'




export class UpdateBeneficiaryDto {
  type?: string;
countryCode?: string;
description?: string;
publicData?: Prisma.InputJsonValue;
privateData?: Prisma.InputJsonValue;
}
