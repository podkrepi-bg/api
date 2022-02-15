
import {Prisma,BeneficiaryType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateBeneficiaryDto {
  @ApiProperty({ enum: BeneficiaryType})
type?: BeneficiaryType;
personId?: string;
companyId?: string;
coordinatorId?: string;
countryCode?: string;
cityId?: string;
description?: string;
publicData?: Prisma.InputJsonValue;
privateData?: Prisma.InputJsonValue;
}
