import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsJSON, IsNotEmpty } from 'class-validator'

export class FilesRoleDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsJSON({ each: true })
  filesRole: string
}
