
import {Prisma} from '@prisma/client'




export class UpdateDonationMetadataDto {
  name?: string;
extraData?: Prisma.InputJsonValue;
}
