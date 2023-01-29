import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { CreatePersonDto } from '@podkrepi-bg/podkrepi-types'
import { Prisma, IrregularityReason, IrregularityStatus, NotifierType } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator'

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

  @Expose()
  @ApiProperty({ enum: IrregularityStatus })
  @IsEnum(IrregularityStatus, { context: IrregularityStatus })
  public readonly status: IrregularityStatus

  @Expose()
  @ApiProperty({ enum: NotifierType })
  @IsEnum(NotifierType, { context: NotifierType })
  public readonly notifierType: NotifierType

  public toEntity(): Prisma.IrregularityCreateInput {
    return {
      notifierType: this.notifierType,
      reason: this.reason,
      status: this.status,
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
