import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsArray } from 'class-validator'

@Expose()
export class DeleteManyBeneficiaryDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @Expose()
  ids: string[]
}
