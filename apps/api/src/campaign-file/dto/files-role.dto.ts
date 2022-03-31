import { ApiProperty } from '@nestjs/swagger'
import { CampaignFileRole } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'

export class FilesRoleDto {
  @ApiProperty()
  @Expose()
  @IsEnum(CampaignFileRole)
  filesRole: CampaignFileRole[]
}
