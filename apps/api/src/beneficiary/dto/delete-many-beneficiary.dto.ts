import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

@Expose()
export class DeleteManyBeneficiaryDto {
  @ApiProperty({ type: [String] })
  @Expose()
  ids: string[]
}
