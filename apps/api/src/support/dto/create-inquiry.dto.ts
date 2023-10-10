import { Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty, PickType } from '@nestjs/swagger'
import { CreatePersonDto } from '@podkrepi-bg/podkrepi-types'

@Expose()
export class CreateInquiryDto extends PickType(CreatePersonDto, [
  'firstName',
  'lastName',
  'email',
  'phone',
  'newsletter',
]) {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly message: string

  public toEntity(): Prisma.InfoRequestCreateInput {
    return {
      person: {
        connectOrCreate: {
          create: {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phone: this.phone,
          },
          where: { email: this.email },
        },
      },
      message: this.message,
    }
  }
}
