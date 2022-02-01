import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"
import { IsString } from "class-validator"

@Expose()
export class CreateCatDto {
    @ApiProperty()
    @Expose()
    @IsString()
    firstName: string
    @ApiProperty()
    @Expose()
    @IsString()
    lastName: string
}
