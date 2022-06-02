import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { UpdatePersonDto } from '../../person/dto/update-person.dto'
import { NotifierType, Prisma, IrregularityReason, IrregularityStatus } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator'

@Expose()
export class UpdateIrregularityDto {
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdatePersonDto)
  public readonly person: UpdatePersonDto

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  public readonly campaignId: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  public readonly personId: string

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
      person: { connect: { id: this.personId } },
    }
  }
}
