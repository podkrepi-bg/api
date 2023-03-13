
import {Prisma,BeneficiaryType,PersonRelation} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class CreateBeneficiaryDto {
  @ApiProperty({ enum: BeneficiaryType})
type: BeneficiaryType;
countryCode: string;
@ApiProperty({ enum: PersonRelation})
coordinatorRelation?: PersonRelation;
description?: string;
privateData?: Prisma.InputJsonValue;
publicData?: Prisma.InputJsonValue;
@ApiProperty({ enum: PersonRelation})
organizerRelation?: PersonRelation;
}
