
import {Prisma,BeneficiaryType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateBeneficiaryDto {
  @ApiProperty({ enum: BeneficiaryType})
type?: BeneficiaryType;
countryCode?: string;
description?: string;
publicData?: Prisma.InputJsonValue;
privateData?: Prisma.InputJsonValue;
}
