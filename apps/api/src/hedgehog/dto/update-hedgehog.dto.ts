import { ApiProperty, PartialType } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'
import { CreateHedgehogDto } from './create-hedgehog.dto'
@Expose()
export class UpdateHedgehogDto extends PartialType(CreateHedgehogDto) {
    @ApiProperty()
    @IsString()
    @Expose()
    firstName?: string
    @ApiProperty()
    @IsString()
    @Expose()
    lastName?: string
}
