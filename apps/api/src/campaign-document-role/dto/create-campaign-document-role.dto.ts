import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateCampaignDocumentRoleDto {
  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string
  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  description: string
}
