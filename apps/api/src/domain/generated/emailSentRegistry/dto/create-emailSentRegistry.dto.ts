import { EmailType } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CreateEmailSentRegistryDto {
  email: string
  dateSent: Date
  @ApiProperty({ enum: EmailType })
  type: EmailType
}
