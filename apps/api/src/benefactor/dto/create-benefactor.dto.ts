import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateBenefactorDto {
  @ApiProperty()
  @Expose()
  @IsUUID()
  personId: string

  @ApiProperty()
  @Expose()
  @IsString()
  extCustomerId: string | null
}
