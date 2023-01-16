import { Prisma, IrregularityReason, IrregularityStatus } from '@prisma/client'
import { Expose, Type } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { CreatePersonDto } from '@podkrepi-bg/podkrepi-types'

@Expose()
export class CreateIrregularityDto {
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePersonDto)
  public readonly person: CreatePersonDto

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  public readonly campaignId: string

  @ApiProperty()
  @Expose()
  @IsString()
  public readonly description: string

  @Expose()
  @ApiProperty({ enum: IrregularityReason })
  @IsEnum(IrregularityReason, { context: IrregularityReason })
  public readonly reason: IrregularityReason

  public toEntity(): Prisma.IrregularityCreateInput {
    return {
      reason: this.reason,
      status: IrregularityStatus.initial,
      description: this.description,
      campaign: { connect: { id: this.campaignId } },
      person: {
        connectOrCreate: {
          create: this.person,
          where: { email: this.person.email },
        },
      },
    }
  }
}
