import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

export class CreateInfoRequestDto {
    @ApiProperty()
    @Expose()
    @IsString()
    personId: string;
    @ApiProperty()
    @Expose()
    @IsString()
    message: string;
}
